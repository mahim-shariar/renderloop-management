import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/team.service.js';

export const list = asyncHandler(async (req, res) => {
  const data = await svc.listTeam({
    search: req.query.search,
    role: req.query.role,
    availability: req.query.availability,
    sort: req.query.sort || 'name',
    limit: req.query.limit ? Math.min(500, Number(req.query.limit)) : 200,
  });
  res.json({ success: true, data });
});

export const get = asyncHandler(async (req, res) => {
  const includePayoutDetails = req.user.role === 'admin';
  const member = await svc.getTeamMember(req.params.id, { includePayoutDetails });
  res.json({ success: true, data: { member } });
});

export const create = asyncHandler(async (req, res) => {
  const member = await svc.createTeamMember(req.body, req.user._id);
  res.status(201).json({ success: true, data: { member } });
});

export const update = asyncHandler(async (req, res) => {
  // payoutDetails is admin-only on write — strip it otherwise
  const body = { ...req.body };
  if (req.user.role !== 'admin') delete body.payoutDetails;
  const member = await svc.updateTeamMember(req.params.id, body);
  res.json({ success: true, data: { member } });
});

export const remove = asyncHandler(async (req, res) => {
  await svc.deleteTeamMember(req.params.id);
  res.json({ success: true, message: 'Team member archived' });
});

// ----- Self-service (the signed-in user's own team profile) -----

export const getMine = asyncHandler(async (req, res) => {
  const member = await svc.getMyTeamProfile(req.user._id);
  res.json({ success: true, data: { member } });
});

export const updateMine = asyncHandler(async (req, res) => {
  const member = await svc.updateMyTeamProfile(req.user._id, req.body);
  res.json({ success: true, data: { member } });
});
