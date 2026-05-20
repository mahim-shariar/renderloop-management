import { asyncHandler } from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { listActivity } from '../services/activity.service.js';

export const list = asyncHandler(async (req, res) => {
  const isStaff = ['admin', 'manager'].includes(req.user.role);

  // Non-staff may only read activity for a specific project (their project
  // detail page). They can never read the global feed or finance activity.
  if (!isStaff && (req.query.entityType !== 'Project' || !req.query.entityId)) {
    throw ApiError.forbidden('Not allowed');
  }

  const data = await listActivity({
    entityType: req.query.entityType,
    entityId: req.query.entityId,
    limit: req.query.limit ? Number(req.query.limit) : 30,
  });
  res.json({ success: true, data });
});
