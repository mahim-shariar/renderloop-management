import mongoose from 'mongoose';

export const VIDEO_TYPES = [
  'youtube_long',
  'youtube_short',
  'reel',
  'tiktok',
  'ad',
  'podcast',
  'wedding',
  'corporate',
  'other',
];

export const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:5', 'other'];

export const PROJECT_PRIORITIES = ['low', 'normal', 'high', 'urgent'];

export const PROJECT_STATUSES = [
  'not_started',
  'footage_received',
  'in_progress',
  'internal_review',
  'awaiting_client_review',
  'revision',
  'approved',
  'delivered',
  'on_hold',
  'cancelled',
];

const linkSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    url: { type: String, required: true, trim: true },
    addedAt: { type: Date, default: () => new Date() },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true }
);

const draftSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true, min: 1 },
    url: { type: String, required: true, trim: true },
    sentAt: { type: Date, default: () => new Date() },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clientFeedback: { type: String, trim: true, default: '' },
    feedbackReceivedAt: { type: Date },
  },
  { _id: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, trim: true, default: 'editor' },
    // What the editor is paid for this project. The editor sees only this —
    // never the real client budget (budgetCents).
    payoutCents: { type: Number, min: 0, default: 0 },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    projectManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedEditors: [assignmentSchema],

    videoType: { type: String, enum: VIDEO_TYPES, default: 'youtube_long' },
    aspectRatio: { type: String, enum: ASPECT_RATIOS, default: '16:9' },
    targetDurationSec: { type: Number, min: 0 },
    actualDurationSec: { type: Number, min: 0 },
    platform: { type: String, trim: true },

    budgetCents: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: 'USD', uppercase: true, maxlength: 3 },

    deadline: { type: Date },
    startedAt: { type: Date },
    deliveredAt: { type: Date },

    priority: { type: String, enum: PROJECT_PRIORITIES, default: 'normal', index: true },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: 'not_started',
      index: true,
    },

    revisionRoundsAllowed: { type: Number, default: 2, min: 0, max: 20 },
    revisionRoundsUsed: { type: Number, default: 0, min: 0 },

    rawFootageLinks: [linkSchema],
    draftLinks: [draftSchema],
    finalDeliveryLink: { type: String, trim: true },
    thumbnailUrl: { type: String, trim: true },

    clientBrief: { type: String, trim: true, default: '' },
    internalNotes: { type: String, trim: true, default: '' },

    tags: [{ type: String, trim: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

projectSchema.index({ title: 'text', tags: 'text' });
projectSchema.index({ deadline: 1, status: 1 });

projectSchema.virtual('revisionsExceeded').get(function () {
  if (this.revisionRoundsAllowed == null) return false;
  return this.revisionRoundsUsed > this.revisionRoundsAllowed;
});

projectSchema.virtual('isOverdue').get(function () {
  if (!this.deadline) return false;
  const ACTIVE = ['delivered', 'cancelled'];
  if (ACTIVE.includes(this.status)) return false;
  return new Date(this.deadline).getTime() < Date.now();
});

projectSchema.virtual('currentDraftVersion').get(function () {
  if (!this.draftLinks?.length) return 0;
  return this.draftLinks.reduce((m, d) => Math.max(m, d.version), 0);
});

export default mongoose.model('Project', projectSchema);
