import mongoose from 'mongoose';

export const CLIENT_STATUSES = ['active', 'paused', 'churned'];
export const PAYMENT_METHODS = ['bank', 'wise', 'payoneer', 'paypal', 'crypto', 'other'];
export const SOCIAL_PLATFORMS = [
  'YouTube',
  'Instagram',
  'TikTok',
  'LinkedIn',
  'Twitter',
  'Facebook',
  'Twitch',
  'Vimeo',
  'Other',
];

const noteEntrySchema = new mongoose.Schema(
  {
    body: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: () => new Date() },
  },
  { _id: true }
);

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    handles: {
      discord: { type: String, trim: true },
      slack: { type: String, trim: true },
      whatsapp: { type: String, trim: true },
    },
    country: { type: String, trim: true },
    timezone: { type: String, trim: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS },
    preferredPlatforms: [{ type: String, enum: SOCIAL_PLATFORMS }],
    defaultRevisionRounds: { type: Number, default: 2, min: 0, max: 20 },
    notes: { type: String, trim: true },
    communicationLog: [noteEntrySchema],
    lastContactedAt: { type: Date },
    status: { type: String, enum: CLIENT_STATUSES, default: 'active', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

clientSchema.index({ name: 'text', company: 'text', email: 'text' });

// Virtuals — real values are computed in service.js via aggregation once Project
// and Payment models exist. Until then they default to 0 on serialization.
clientSchema.virtual('activeProjects').get(function () {
  return this._activeProjects ?? 0;
});
clientSchema.virtual('totalPaid').get(function () {
  return this._totalPaid ?? 0;
});
clientSchema.virtual('pendingAmount').get(function () {
  return this._pendingAmount ?? 0;
});
clientSchema.virtual('lifetimeRevenue').get(function () {
  return this._lifetimeRevenue ?? 0;
});

export default mongoose.model('Client', clientSchema);
