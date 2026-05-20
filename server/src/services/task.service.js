import Task from '../models/Task.js';
import ApiError from '../utils/ApiError.js';
import { onTaskAssigned } from './notification.service.js';

const POPULATE = [
  { path: 'assignedTo', select: 'name email avatarUrl role' },
  { path: 'project', select: 'title' },
  { path: 'createdBy', select: 'name' },
];

export async function listTasks({ scope, userId, status, projectId, assignedTo }) {
  const filter = {};
  if (status) filter.status = status;
  if (projectId) filter.project = projectId;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (scope === 'mine') {
    filter.$or = [{ assignedTo: userId }, { createdBy: userId }];
  }
  const items = await Task.find(filter).sort('-createdAt').limit(500).populate(POPULATE);
  return { items };
}

export async function getTask(id) {
  const task = await Task.findById(id).populate(POPULATE);
  if (!task) throw ApiError.notFound('Task not found');
  return task;
}

export async function createTask(data, userId) {
  const task = await Task.create({ ...data, createdBy: userId });
  if (task.assignedTo && task.assignedTo.toString() !== userId.toString()) {
    await onTaskAssigned(task);
  }
  return getTask(task._id);
}

export async function updateTask(id, data) {
  const task = await Task.findById(id);
  if (!task) throw ApiError.notFound('Task not found');

  const prevAssignee = task.assignedTo?.toString();

  if (data.status && data.status !== task.status) {
    data.completedAt = data.status === 'done' ? new Date() : null;
  }
  Object.assign(task, data);
  await task.save();

  if (task.assignedTo && task.assignedTo.toString() !== prevAssignee) {
    await onTaskAssigned(task);
  }
  return getTask(task._id);
}

export async function deleteTask(id) {
  const task = await Task.findByIdAndDelete(id);
  if (!task) throw ApiError.notFound('Task not found');
  return task;
}
