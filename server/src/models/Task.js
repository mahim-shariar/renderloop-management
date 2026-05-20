import mongoose from 'mongoose';

export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'revisions', 'done'];
export const TASK_PRIORITIES = ['low', 'normal', 'high', 'urgent'];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'normal' },
    dueDate: { type: Date, index: true },
    status: { type: String, enum: TASK_STATUSES, default: 'todo', index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    completedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
