import Notification from '../models/Notification.js';
import Project from '../models/Project.js';
import Salary from '../models/Salary.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { sendToUser } from './push.service.js';

/**
 * Create a notification. If dedupeKey is provided and a notification with that
 * key already exists for the user, this is a no-op (used by the time sweep).
 * On creation, also fires a web push to every subscribed device for the user
 * so it appears in the OS notification tray even when the tab is closed.
 */
export async function notify(userId, { type, title, body, link, dedupeKey, meta }) {
  if (!userId) return null;
  if (dedupeKey) {
    const existing = await Notification.findOne({ user: userId, dedupeKey });
    if (existing) return existing;
  }
  const doc = await Notification.create({ user: userId, type, title, body, link, dedupeKey, meta });
  // Fire-and-forget; push failures must not break the request that created the notification.
  sendToUser(userId, {
    id: doc._id.toString(),
    type,
    title,
    body: body || '',
    link: link || '/',
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[notify] push dispatch failed:', err?.message);
  });
  return doc;
}

export async function notifyMany(userIds, payload) {
  const unique = [...new Set(userIds.filter(Boolean).map((id) => id.toString()))];
  return Promise.all(unique.map((id) => notify(id, payload)));
}

export async function listNotifications(userId, { unreadOnly } = {}) {
  const filter = { user: userId };
  if (unreadOnly) filter.read = false;
  const [items, unreadCount] = await Promise.all([
    Notification.find(filter).sort('-createdAt').limit(50).lean(),
    Notification.countDocuments({ user: userId, read: false }),
  ]);
  return { items, unreadCount };
}

export async function markRead(userId, id) {
  return Notification.findOneAndUpdate({ _id: id, user: userId }, { read: true }, { new: true });
}

export async function markAllRead(userId) {
  await Notification.updateMany({ user: userId, read: false }, { read: true });
  return { ok: true };
}

// ----- Event-driven triggers (called inline from other services) -----

function projectRecipients(project) {
  const ids = [];
  if (project.projectManager) {
    ids.push(project.projectManager._id || project.projectManager);
  }
  (project.assignedEditors || []).forEach((a) => {
    ids.push(a.user?._id || a.user);
  });
  return ids;
}

export async function onDraftUploaded(project, version) {
  await notifyMany(projectRecipients(project), {
    type: 'draft_uploaded',
    title: `Draft v${version} uploaded`,
    body: `A new draft was posted on "${project.title}".`,
    link: `/projects/${project._id}`,
  });
}

export async function onClientFeedback(project, version) {
  await notifyMany(projectRecipients(project), {
    type: 'client_feedback',
    title: 'Client feedback received',
    body: `Feedback logged on draft v${version} of "${project.title}".`,
    link: `/projects/${project._id}`,
  });
}

export async function onRevisionsExceeded(project) {
  await notifyMany(projectRecipients(project), {
    type: 'revisions_exceeded',
    title: 'Revision rounds exceeded',
    body: `"${project.title}" has used more revisions than allowed — consider billing the client.`,
    link: `/projects/${project._id}`,
    dedupeKey: `revisions_exceeded:${project._id}:${project.revisionRoundsUsed}`,
  });
}

export async function onTaskAssigned(task) {
  if (!task.assignedTo) return;
  await notify(task.assignedTo, {
    type: 'task_assigned',
    title: 'New task assigned',
    body: task.title,
    link: '/tasks',
    dedupeKey: `task_assigned:${task._id}:${task.assignedTo}`,
  });
}

export async function onProjectAssigned(project, userIds) {
  await notifyMany(userIds, {
    type: 'project_assigned',
    title: 'New project assignment',
    body: `You were assigned to "${project.title}".`,
    link: `/projects/${project._id}`,
  });
}

export async function onProjectStatusChanged(project, toStatus, actorId) {
  // Notify everyone on the project except the person who made the change.
  const recipients = projectRecipients(project).filter(
    (id) => id && id.toString() !== actorId?.toString()
  );
  await notifyMany(recipients, {
    type: 'project_status_changed',
    title: 'Project status updated',
    body: `"${project.title}" moved to ${toStatus.replace(/_/g, ' ')}.`,
    link: `/projects/${project._id}`,
  });
}

// ----- Time-based sweep -----

export async function runSweep() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  let created = 0;

  const admins = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true })
    .select('_id')
    .lean();
  const adminIds = admins.map((a) => a._id);

  // Project deadlines approaching / overdue
  const liveProjects = await Project.find({
    deadline: { $ne: null },
    status: { $nin: ['delivered', 'cancelled'] },
  })
    .populate('projectManager', '_id')
    .lean();

  for (const p of liveProjects) {
    const deadline = new Date(p.deadline);
    const recipients = projectRecipients(p);
    if (deadline < now) {
      const r = await notifyMany(recipients, {
        type: 'deadline_overdue',
        title: 'Project overdue',
        body: `"${p.title}" passed its deadline.`,
        link: `/projects/${p._id}`,
        dedupeKey: `deadline_overdue:${p._id}:${deadline.toISOString().slice(0, 10)}`,
      });
      created += r.filter(Boolean).length;
    } else if (deadline <= in24h) {
      const r = await notifyMany(recipients, {
        type: 'deadline_approaching',
        title: 'Deadline within 24h',
        body: `"${p.title}" is due soon.`,
        link: `/projects/${p._id}`,
        dedupeKey: `deadline_approaching:${p._id}:${deadline.toISOString().slice(0, 10)}`,
      });
      created += r.filter(Boolean).length;
    }
  }

  // Salary payouts due
  const dueSalaries = await Salary.find({
    paid: false,
    dueOn: { $ne: null, $lte: in24h },
  })
    .populate('teamMember', 'name')
    .lean();
  for (const s of dueSalaries) {
    const r = await notifyMany(adminIds, {
      type: 'salary_due',
      title: 'Payout due',
      body: `Payout to ${s.teamMember?.name || 'a team member'} is due.`,
      link: '/finance',
      dedupeKey: `salary_due:${s._id}`,
    });
    created += r.filter(Boolean).length;
  }

  // Payments overdue (pending past their date)
  const overduePayments = await Payment.find({
    status: 'pending',
    date: { $lt: now },
  })
    .populate('client', 'name')
    .lean();
  for (const pay of overduePayments) {
    const r = await notifyMany(adminIds, {
      type: 'payment_overdue',
      title: 'Payment overdue',
      body: `A pending payment${pay.client ? ` from ${pay.client.name}` : ''} is past due.`,
      link: '/finance',
      dedupeKey: `payment_overdue:${pay._id}`,
    });
    created += r.filter(Boolean).length;
  }

  return { created };
}
