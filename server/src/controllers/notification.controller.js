import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/notification.service.js';

export const list = asyncHandler(async (req, res) => {
  const data = await svc.listNotifications(req.user._id, {
    unreadOnly: req.query.unreadOnly === 'true',
  });
  res.json({ success: true, data });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await svc.markRead(req.user._id, req.params.id);
  res.json({ success: true, data: { notification } });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await svc.markAllRead(req.user._id);
  res.json({ success: true, message: 'All marked read' });
});

export const sweep = asyncHandler(async (_req, res) => {
  const result = await svc.runSweep();
  res.json({ success: true, data: result });
});
