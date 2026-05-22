import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/notification.service.js';
import * as push from '../services/push.service.js';

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

export const pushKey = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: { publicKey: push.getPublicKey() } });
});

export const pushSubscribe = asyncHandler(async (req, res) => {
  const sub = await push.saveSubscription(
    req.user._id,
    req.body?.subscription,
    req.headers['user-agent']
  );
  res.json({ success: true, data: { id: sub._id } });
});

export const pushUnsubscribe = asyncHandler(async (req, res) => {
  const result = await push.removeSubscription(req.user._id, req.body?.endpoint);
  res.json({ success: true, data: result });
});

export const pushTest = asyncHandler(async (req, res) => {
  const result = await push.sendToUser(req.user._id, {
    id: 'test',
    type: 'test',
    title: 'Test notification',
    body: 'Push notifications are working.',
    link: '/',
  });
  res.json({ success: true, data: result });
});
