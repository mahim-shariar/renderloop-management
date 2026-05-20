import Project, { PROJECT_STATUSES } from '../models/Project.js';
import Client from '../models/Client.js';
import ApiError from '../utils/ApiError.js';
import {
  onDraftUploaded,
  onClientFeedback,
  onRevisionsExceeded,
  onProjectAssigned,
  onProjectStatusChanged,
} from './notification.service.js';
import { logActivity } from './activity.service.js';

const POPULATE = [
  { path: 'client', select: 'name company status defaultRevisionRounds' },
  { path: 'projectManager', select: 'name email avatarUrl role' },
  { path: 'assignedEditors.user', select: 'name email avatarUrl role' },
  { path: 'draftLinks.sentBy', select: 'name email avatarUrl' },
  { path: 'rawFootageLinks.addedBy', select: 'name email avatarUrl' },
];

/**
 * Editors and clients must never see the real client budget. This returns a
 * plain object with `budgetCents` removed and `myPayoutCents` (what the viewer
 * is paid for this project) added. Staff (admin/manager) get the full object.
 */
export function sanitizeProjectForViewer(project, user) {
  const obj = typeof project?.toJSON === 'function' ? project.toJSON() : { ...project };
  const isStaff = user && (user.role === 'admin' || user.role === 'manager');
  if (isStaff) return obj;

  const uid = user?._id?.toString();
  const mine = (obj.assignedEditors || []).find((a) => {
    const au = a.user?._id || a.user;
    return au?.toString() === uid;
  });
  obj.myPayoutCents = mine?.payoutCents ?? 0;
  delete obj.budgetCents;
  // Strip the per-person payouts of OTHER editors too.
  obj.assignedEditors = (obj.assignedEditors || []).map((a) => {
    const au = a.user?._id || a.user;
    const copy = { ...a };
    if (au?.toString() !== uid) delete copy.payoutCents;
    return copy;
  });
  return obj;
}

function buildFilter({ search, status, clientId, editorId, priority, videoType, deadlineFrom, deadlineTo }) {
  const filter = {};
  if (status) filter.status = Array.isArray(status) ? { $in: status } : status;
  if (priority) filter.priority = priority;
  if (videoType) filter.videoType = videoType;
  if (clientId) filter.client = clientId;
  if (editorId) {
    filter.$or = [
      { 'assignedEditors.user': editorId },
      { projectManager: editorId },
    ];
  }
  if (deadlineFrom || deadlineTo) {
    filter.deadline = {};
    if (deadlineFrom) filter.deadline.$gte = new Date(deadlineFrom);
    if (deadlineTo) filter.deadline.$lte = new Date(deadlineTo);
  }
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$and = [
      { $or: [{ title: re }, { tags: re }] },
      ...(filter.$or ? [{ $or: filter.$or }] : []),
    ];
    delete filter.$or;
  }
  return filter;
}

export async function listProjects({
  search,
  status,
  clientId,
  editorId,
  priority,
  videoType,
  deadlineFrom,
  deadlineTo,
  sort = '-createdAt',
  page = 1,
  limit = 100,
}) {
  const filter = buildFilter({
    search,
    status,
    clientId,
    editorId,
    priority,
    videoType,
    deadlineFrom,
    deadlineTo,
  });
  const skip = (Math.max(1, page) - 1) * limit;
  const [items, total] = await Promise.all([
    Project.find(filter).populate(POPULATE).sort(sort).skip(skip).limit(limit),
    Project.countDocuments(filter),
  ]);
  return { items, total, page, limit };
}

export async function getProject(id) {
  const project = await Project.findById(id).populate(POPULATE);
  if (!project) throw ApiError.notFound('Project not found');
  return project;
}

export async function createProject(data, userId) {
  const payload = { ...data, createdBy: userId };
  if (payload.client && (payload.revisionRoundsAllowed == null || payload.revisionRoundsAllowed === '')) {
    const client = await Client.findById(payload.client).select('defaultRevisionRounds');
    if (client?.defaultRevisionRounds != null) {
      payload.revisionRoundsAllowed = client.defaultRevisionRounds;
    }
  }
  const project = await Project.create(payload);
  await logActivity({
    actor: userId,
    action: 'project_created',
    summary: `Created project "${project.title}"`,
    entityType: 'Project',
    entityId: project._id,
    link: `/projects/${project._id}`,
  });
  const populated = await getProject(project._id);

  // Notify the editors assigned at creation.
  const assignedIds = (populated.assignedEditors || []).map((a) => a.user?._id || a.user);
  if (assignedIds.length) await onProjectAssigned(populated, assignedIds);

  return populated;
}

export async function updateProject(id, data, actorId) {
  const project = await Project.findById(id);
  if (!project) throw ApiError.notFound('Project not found');

  const prevStatus = project.status;
  const prevEditorIds = (project.assignedEditors || []).map((a) => a.user.toString());

  // Auto-stamp lifecycle timestamps on status transitions
  if (data.status && data.status !== project.status) {
    if (data.status === 'in_progress' && !project.startedAt) data.startedAt = new Date();
    if (data.status === 'delivered' && !project.deliveredAt) data.deliveredAt = new Date();
  }

  Object.assign(project, data);
  await project.save();
  const populated = await getProject(project._id);

  if (data.status && data.status !== prevStatus) {
    await logActivity({
      actor: actorId,
      action: 'project_status_changed',
      summary: `"${project.title}" moved ${prevStatus.replace(/_/g, ' ')} → ${data.status.replace(/_/g, ' ')}`,
      entityType: 'Project',
      entityId: project._id,
      link: `/projects/${project._id}`,
    });
    await onProjectStatusChanged(populated, data.status, actorId);
  }

  // Notify editors newly added in this update.
  if (data.assignedEditors) {
    const added = (populated.assignedEditors || [])
      .map((a) => a.user?._id || a.user)
      .filter((uid) => uid && !prevEditorIds.includes(uid.toString()));
    if (added.length) await onProjectAssigned(populated, added);
  }

  return populated;
}

export async function deleteProject(id) {
  const project = await Project.findByIdAndDelete(id);
  if (!project) throw ApiError.notFound('Project not found');
  return project;
}

export async function setStatus(id, status, actorId) {
  if (!PROJECT_STATUSES.includes(status)) {
    throw ApiError.badRequest('Invalid status');
  }
  return updateProject(id, { status }, actorId);
}

export async function addRawFootageLink(id, { label, url }, userId) {
  const project = await Project.findById(id);
  if (!project) throw ApiError.notFound('Project not found');
  project.rawFootageLinks.push({ label, url, addedBy: userId });
  await project.save();
  return getProject(project._id);
}

export async function removeRawFootageLink(id, linkId) {
  const project = await Project.findById(id);
  if (!project) throw ApiError.notFound('Project not found');
  const entry = project.rawFootageLinks.id(linkId);
  if (!entry) throw ApiError.notFound('Footage link not found');
  entry.deleteOne();
  await project.save();
  return getProject(project._id);
}

export async function addDraft(id, { url }, userId) {
  const project = await Project.findById(id);
  if (!project) throw ApiError.notFound('Project not found');
  const nextVersion = project.draftLinks.reduce((m, d) => Math.max(m, d.version), 0) + 1;
  project.draftLinks.push({ version: nextVersion, url, sentBy: userId });

  // A draft above v1 represents a revision delivery
  if (nextVersion > 1) {
    project.revisionRoundsUsed = nextVersion - 1;
  }

  // Auto-advance status to awaiting_client_review when a draft is sent
  if (['in_progress', 'internal_review', 'revision'].includes(project.status)) {
    project.status = 'awaiting_client_review';
  }

  await project.save();
  const populated = await getProject(project._id);

  await onDraftUploaded(populated, nextVersion);
  await logActivity({
    actor: userId,
    action: 'draft_uploaded',
    summary: `Draft v${nextVersion} posted on "${populated.title}"`,
    entityType: 'Project',
    entityId: populated._id,
    link: `/projects/${populated._id}`,
  });
  if (
    populated.revisionRoundsAllowed != null &&
    populated.revisionRoundsUsed > populated.revisionRoundsAllowed
  ) {
    await onRevisionsExceeded(populated);
  }

  return populated;
}

export async function setDraftFeedback(id, draftId, { clientFeedback }) {
  const project = await Project.findById(id);
  if (!project) throw ApiError.notFound('Project not found');
  const draft = project.draftLinks.id(draftId);
  if (!draft) throw ApiError.notFound('Draft not found');
  draft.clientFeedback = clientFeedback;
  draft.feedbackReceivedAt = new Date();
  // If feedback is recorded while awaiting client review, advance to revision
  if (project.status === 'awaiting_client_review' && clientFeedback?.trim()) {
    project.status = 'revision';
  }
  await project.save();
  const populated = await getProject(project._id);

  if (clientFeedback?.trim()) {
    await onClientFeedback(populated, draft.version);
  }

  return populated;
}

export async function removeDraft(id, draftId) {
  const project = await Project.findById(id);
  if (!project) throw ApiError.notFound('Project not found');
  const draft = project.draftLinks.id(draftId);
  if (!draft) throw ApiError.notFound('Draft not found');
  draft.deleteOne();
  // Recompute revisionRoundsUsed
  const maxV = project.draftLinks.reduce((m, d) => Math.max(m, d.version), 0);
  project.revisionRoundsUsed = Math.max(0, maxV - 1);
  await project.save();
  return getProject(project._id);
}

export async function countActiveForClient(clientId) {
  const ACTIVE = PROJECT_STATUSES.filter(
    (s) => !['delivered', 'cancelled', 'on_hold'].includes(s)
  );
  return Project.countDocuments({ client: clientId, status: { $in: ACTIVE } });
}
