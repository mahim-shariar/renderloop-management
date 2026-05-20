import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = [
  'deadline_approaching',
  'deadline_overdue',
  'draft_uploaded',
  'client_feedback',
  'revisions_exceeded',
  'salary_due',
  'payment_overdue',
  'task_assigned',
  'project_assigned',
  'project_status_changed',
];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, trim: true },
    link: { type: String, trim: true },
    read: { type: Boolean, default: false, index: true },
    // dedupeKey prevents the time-based sweep from re-creating the same notification
    dedupeKey: { type: String, index: true },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
