import { asyncHandler } from '../utils/asyncHandler.js';
import { getOverview, getAnalytics, getMyDashboard } from '../services/insights.service.js';

export const overview = asyncHandler(async (_req, res) => {
  const data = await getOverview();
  res.json({ success: true, data });
});

export const analytics = asyncHandler(async (_req, res) => {
  const data = await getAnalytics();
  res.json({ success: true, data });
});

export const myDashboard = asyncHandler(async (req, res) => {
  const data = await getMyDashboard(req.user);
  res.json({ success: true, data });
});
