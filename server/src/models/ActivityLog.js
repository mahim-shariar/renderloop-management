import mongoose from 'mongoose';

export const ACTIVITY_ACTIONS = [
  'project_status_changed',
  'project_created',
  'draft_uploaded',
  'payment_received',
  'payout_paid',
  'team_assigned',
  'client_invited',
  'user_invited',
];

const activityLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ACTIVITY_ACTIONS, required: true },
    summary: { type: String, required: true, trim: true },
    entityType: { type: String, trim: true }, // 'Project' | 'Payment' | ...
    entityId: { type: mongoose.Schema.Types.ObjectId },
    link: { type: String, trim: true },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
