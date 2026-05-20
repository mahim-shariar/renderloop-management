import mongoose from 'mongoose';
import TeamMember from '../models/TeamMember.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { decrypt } from '../utils/crypto.js';

// Team roles that map to the elevated 'manager' login role; everything else
// (colorist, sound designer, etc.) gets the 'editor' login role.
function loginRoleFor(teamRole) {
  return teamRole === 'manager' ? 'manager' : 'editor';
}

const ACTIVE_STATUSES = [
  'not_started',
  'footage_received',
  'in_progress',
  'internal_review',
  'awaiting_client_review',
  'revision',
  'approved',
];

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

async function attachStats(members) {
  if (!members.length) return members;
  const userIds = members
    .filter((m) => m.user)
    .map((m) => (typeof m.user === 'object' ? m.user._id : m.user));

  if (!userIds.length) {
    return members.map((m) => ({
      ...m,
      activeProjects: 0,
      projectsCompletedThisMonth: 0,
      totalEarnings: 0,
      pendingPayouts: 0,
      avgTurnaroundDays: null,
    }));
  }

  const monthStart = startOfMonth();

  // Aggregate active and monthly counts in one pipeline per metric
  const [activeAgg, completedAgg, turnaroundAgg] = await Promise.all([
    Project.aggregate([
      { $match: { 'assignedEditors.user': { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) }, status: { $in: ACTIVE_STATUSES } } },
      { $unwind: '$assignedEditors' },
      { $match: { 'assignedEditors.user': { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: '$assignedEditors.user', count: { $sum: 1 } } },
    ]),
    Project.aggregate([
      {
        $match: {
          'assignedEditors.user': { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) },
          status: 'delivered',
          deliveredAt: { $gte: monthStart },
        },
      },
      { $unwind: '$assignedEditors' },
      { $match: { 'assignedEditors.user': { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: '$assignedEditors.user', count: { $sum: 1 } } },
    ]),
    Project.aggregate([
      {
        $match: {
          'assignedEditors.user': { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) },
          status: 'delivered',
          startedAt: { $ne: null },
          deliveredAt: { $ne: null },
        },
      },
      { $unwind: '$assignedEditors' },
      { $match: { 'assignedEditors.user': { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
      {
        $project: {
          user: '$assignedEditors.user',
          days: {
            $divide: [
              { $subtract: ['$deliveredAt', '$startedAt'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
      { $group: { _id: '$user', avg: { $avg: '$days' }, n: { $sum: 1 } } },
    ]),
  ]);

  const activeMap = new Map(activeAgg.map((r) => [r._id.toString(), r.count]));
  const completedMap = new Map(completedAgg.map((r) => [r._id.toString(), r.count]));
  const turnaroundMap = new Map(turnaroundAgg.map((r) => [r._id.toString(), r.avg]));

  return members.map((m) => {
    const uid = m.user && (typeof m.user === 'object' ? m.user._id?.toString() : m.user.toString());
    return {
      ...m,
      activeProjects: uid ? activeMap.get(uid) || 0 : 0,
      projectsCompletedThisMonth: uid ? completedMap.get(uid) || 0 : 0,
      avgTurnaroundDays: uid && turnaroundMap.has(uid) ? Number(turnaroundMap.get(uid).toFixed(1)) : null,
      // totalEarnings / pendingPayouts come from Salary model (Phase 7) — return 0 for now
      totalEarnings: 0,
      pendingPayouts: 0,
    };
  });
}

export async function listTeam({ search, role, availability, sort = 'name', limit = 200 }) {
  const filter = { isActive: true };
  if (role) filter.role = role;
  if (availability) filter.availability = availability;
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: re }, { email: re }, { specialties: re }];
  }
  const docs = await TeamMember.find(filter)
    .sort(sort)
    .limit(limit)
    .populate('user', 'name email avatarUrl')
    .lean({ virtuals: true });
  const withStats = await attachStats(docs);
  return { items: withStats, total: withStats.length };
}

export async function getTeamMember(id, { includePayoutDetails = false } = {}) {
  const query = TeamMember.findById(id).populate('user', 'name email avatarUrl role');
  if (includePayoutDetails) query.select('+payoutDetails');
  const member = await query.lean({ virtuals: true });
  if (!member) throw ApiError.notFound('Team member not found');
  if (includePayoutDetails && member.payoutDetails) {
    member.payoutDetails = decrypt(member.payoutDetails);
  }
  const [withStats] = await attachStats([member]);

  // Attach the list of assigned projects (active + recently completed) when we have a linked user
  let assignedProjects = [];
  if (member.user?._id || member.user) {
    const userId = member.user?._id || member.user;
    assignedProjects = await Project.find({ 'assignedEditors.user': userId })
      .sort('-updatedAt')
      .limit(50)
      .populate('client', 'name')
      .lean();
  }

  return { ...withStats, assignedProjects };
}

export async function createTeamMember(data, userId) {
  const { tempPassword, ...memberData } = data;

  if (!memberData.email) throw ApiError.badRequest('Email is required to create a login account');
  if (!tempPassword || tempPassword.length < 8) {
    throw ApiError.badRequest('A temporary password of at least 8 characters is required');
  }

  const email = memberData.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('A user account with this email already exists');

  // Always create a login account so the team member can sign in.
  const account = await User.create({
    name: memberData.name,
    email,
    password: tempPassword,
    role: loginRoleFor(memberData.role),
  });

  try {
    const member = await TeamMember.create({
      ...memberData,
      email,
      user: account._id,
      createdBy: userId,
    });
    return getTeamMember(member._id);
  } catch (err) {
    // Roll back the orphaned account if the member fails validation.
    await User.deleteOne({ _id: account._id });
    throw err;
  }
}

export async function updateTeamMember(id, data) {
  const member = await TeamMember.findById(id);
  if (!member) throw ApiError.notFound('Team member not found');
  // tempPassword / newPassword are not persisted on the team member document.
  const { tempPassword, newPassword, ...patch } = data;

  // Keep the linked login account in sync — admins can change a member's
  // login email and reset their password from the team form.
  if (member.user) {
    const account = await User.findById(member.user);
    if (account) {
      if (patch.email && patch.email.toLowerCase() !== account.email) {
        const exists = await User.findOne({
          email: patch.email.toLowerCase(),
          _id: { $ne: account._id },
        });
        if (exists) throw ApiError.conflict('A user with this email already exists');
        account.email = patch.email.toLowerCase();
      }
      if (newPassword) account.password = newPassword;
      if (account.isModified()) await account.save();
    }
  }

  // Mongoose setter encrypts when assigning to payoutDetails
  Object.assign(member, patch);
  await member.save();
  return getTeamMember(member._id);
}

export async function deleteTeamMember(id) {
  // Soft delete by setting isActive=false (keeps payout history references intact)
  const member = await TeamMember.findById(id);
  if (!member) throw ApiError.notFound('Team member not found');
  member.isActive = false;
  await member.save();
  // Deactivate the linked login account so they can no longer sign in.
  if (member.user) {
    await User.findByIdAndUpdate(member.user, { isActive: false });
  }
  return member;
}

// ----- Self-service: the signed-in user's own team profile -----

/** Returns the team profile linked to a user, with payoutDetails decrypted. */
export async function getMyTeamProfile(userId) {
  const member = await TeamMember.findOne({ user: userId })
    .select('+payoutDetails')
    .lean();
  if (!member) return null;
  if (member.payoutDetails) member.payoutDetails = decrypt(member.payoutDetails);
  return member;
}

/** A team member updates only their own self-editable fields. */
export async function updateMyTeamProfile(userId, data) {
  const member = await TeamMember.findOne({ user: userId }).select('+payoutDetails');
  if (!member) {
    throw ApiError.notFound('No team profile is linked to your account');
  }
  const SELF_EDITABLE = ['paymentMethod', 'payoutDetails', 'availability', 'bio', 'specialties'];
  for (const key of SELF_EDITABLE) {
    if (data[key] !== undefined) member[key] = data[key];
  }
  await member.save();
  return getMyTeamProfile(userId);
}
