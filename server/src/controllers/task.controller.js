import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/task.service.js';

export const list = asyncHandler(async (req, res) => {
  const data = await svc.listTasks({
    scope: req.query.scope,
    userId: req.user._id,
    status: req.query.status,
    projectId: req.query.projectId,
    assignedTo: req.query.assignedTo,
  });
  res.json({ success: true, data });
});

export const get = asyncHandler(async (req, res) => {
  const task = await svc.getTask(req.params.id);
  res.json({ success: true, data: { task } });
});

export const create = asyncHandler(async (req, res) => {
  const task = await svc.createTask(req.body, req.user._id);
  res.status(201).json({ success: true, data: { task } });
});

export const update = asyncHandler(async (req, res) => {
  const task = await svc.updateTask(req.params.id, req.body);
  res.json({ success: true, data: { task } });
});

export const remove = asyncHandler(async (req, res) => {
  await svc.deleteTask(req.params.id);
  res.json({ success: true, message: 'Task deleted' });
});
