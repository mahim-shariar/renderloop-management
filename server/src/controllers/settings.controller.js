import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/settings.service.js';

export const get = asyncHandler(async (_req, res) => {
  const settings = await svc.getSettings();
  res.json({ success: true, data: { settings } });
});

export const update = asyncHandler(async (req, res) => {
  const settings = await svc.updateSettings(req.body);
  res.json({ success: true, data: { settings } });
});
