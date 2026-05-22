import { asyncHandler } from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as svc from '../services/project.service.js';
import TeamMember from '../models/TeamMember.js';
import { getRates } from '../services/currency.service.js';

function parseArrayParam(v) {
  if (!v) return undefined;
  return Array.isArray(v) ? v : String(v).split(',').filter(Boolean);
}

/**
 * Currency context for sanitizeProjectForViewer — resolves the viewer's own
 * payout currency (from their TeamMember profile) plus live USD rates.
 * Returns null for staff, who see raw USD budgets.
 */
async function viewerCurrencyContext(user) {
  if (['admin', 'manager'].includes(user.role)) return null;
  const [member, rates] = await Promise.all([
    TeamMember.findOne({ user: user._id }).select('currency').lean(),
    getRates(),
  ]);
  return { payoutCurrency: (member?.currency || 'USD').toUpperCase(), rates };
}

/**
 * Send a project response, always run through the viewer sanitizer so an
 * editor never receives the client budget or other editors' payouts —
 * regardless of which mutating endpoint produced the project.
 */
async function respondProject(res, project, user, statusCode = 200) {
  const ctx = await viewerCurrencyContext(user);
  res.status(statusCode).json({
    success: true,
    data: { project: svc.sanitizeProjectForViewer(project, user, ctx) },
  });
}

/**
 * Fetch a project and ensure the requester may touch it. Staff see all;
 * editors/clients may only access projects they are assigned to or manage.
 */
async function requireProjectAccess(projectId, user) {
  const project = await svc.getProject(projectId);
  const isStaff = ['admin', 'manager'].includes(user.role);
  if (!isStaff) {
    const uid = user._id.toString();
    const assigned = (project.assignedEditors || []).some(
      (a) => (a.user?._id || a.user)?.toString() === uid
    );
    const isPM =
      project.projectManager &&
      (project.projectManager._id || project.projectManager).toString() === uid;
    if (!assigned && !isPM) {
      throw ApiError.forbidden('You do not have access to this project');
    }
  }
  return project;
}

export const list = asyncHandler(async (req, res) => {
  const isStaff = ['admin', 'manager'].includes(req.user.role);
  const data = await svc.listProjects({
    search: req.query.search,
    status: parseArrayParam(req.query.status),
    clientId: req.query.clientId,
    // Editors/clients only ever see projects they're assigned to.
    editorId: isStaff ? req.query.editorId : req.user._id,
    priority: req.query.priority,
    videoType: req.query.videoType,
    deadlineFrom: req.query.deadlineFrom,
    deadlineTo: req.query.deadlineTo,
    sort: req.query.sort || '-createdAt',
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Math.min(200, Number(req.query.limit)) : 100,
  });
  const ctx = await viewerCurrencyContext(req.user);
  data.items = data.items.map((p) => svc.sanitizeProjectForViewer(p, req.user, ctx));
  res.json({ success: true, data });
});

export const get = asyncHandler(async (req, res) => {
  const project = await requireProjectAccess(req.params.id, req.user);
  await respondProject(res, project, req.user);
});

export const create = asyncHandler(async (req, res) => {
  const project = await svc.createProject(req.body, req.user._id);
  res.status(201).json({ success: true, data: { project } });
});

// Fields only staff (admin/manager) may write. Editors can update workflow
// fields (status, links, notes…) but never money or team assignments.
const STAFF_ONLY_FIELDS = [
  'budgetCents',
  'currency',
  'assignedEditors',
  'client',
  'projectManager',
  'revisionRoundsAllowed',
];

export const update = asyncHandler(async (req, res) => {
  await requireProjectAccess(req.params.id, req.user);
  const isStaff = ['admin', 'manager'].includes(req.user.role);
  const data = { ...req.body };
  if (!isStaff) {
    // Strip privileged fields so an editor can't set a budget or change payouts.
    for (const f of STAFF_ONLY_FIELDS) delete data[f];
  }
  const project = await svc.updateProject(req.params.id, data, req.user._id);
  await respondProject(res, project, req.user);
});

export const remove = asyncHandler(async (req, res) => {
  await svc.deleteProject(req.params.id);
  res.json({ success: true, message: 'Project deleted' });
});

export const setStatus = asyncHandler(async (req, res) => {
  await requireProjectAccess(req.params.id, req.user);
  const project = await svc.setStatus(req.params.id, req.body.status, req.user._id);
  await respondProject(res, project, req.user);
});

export const addFootage = asyncHandler(async (req, res) => {
  await requireProjectAccess(req.params.id, req.user);
  const project = await svc.addRawFootageLink(req.params.id, req.body, req.user._id);
  await respondProject(res, project, req.user, 201);
});

export const removeFootage = asyncHandler(async (req, res) => {
  await requireProjectAccess(req.params.id, req.user);
  const project = await svc.removeRawFootageLink(req.params.id, req.params.linkId);
  await respondProject(res, project, req.user);
});

export const addDraft = asyncHandler(async (req, res) => {
  await requireProjectAccess(req.params.id, req.user);
  const project = await svc.addDraft(req.params.id, req.body, req.user._id);
  await respondProject(res, project, req.user, 201);
});

export const updateDraftFeedback = asyncHandler(async (req, res) => {
  await requireProjectAccess(req.params.id, req.user);
  const project = await svc.setDraftFeedback(req.params.id, req.params.draftId, req.body);
  await respondProject(res, project, req.user);
});

export const removeDraft = asyncHandler(async (req, res) => {
  await requireProjectAccess(req.params.id, req.user);
  const project = await svc.removeDraft(req.params.id, req.params.draftId);
  await respondProject(res, project, req.user);
});
