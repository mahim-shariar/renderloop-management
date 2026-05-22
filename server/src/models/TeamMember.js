import mongoose from 'mongoose';
import { CURRENCIES } from '../config/currencies.js';
import { encrypt } from '../utils/crypto.js';

export const TEAM_ROLES = [
  'editor',
  'colorist',
  'sound_designer',
  'motion_graphics',
  'thumbnail_designer',
  'manager',
];

export const SALARY_TYPES = ['monthly', 'per_project', 'per_minute_of_footage'];
export const AVAILABILITIES = ['available', 'busy', 'on_leave'];
export const PAYOUT_METHODS = [
  'wise',
  'payoneer',
  'bank',
  'crypto',
  'paypal',
  'bkash',
  'nagad',
  'rocket',
  'other',
];

const teamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, lowercase: true, trim: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: TEAM_ROLES, default: 'editor', required: true, index: true },
    specialties: [{ type: String, trim: true, maxlength: 40 }],
    salaryType: { type: String, enum: SALARY_TYPES, default: 'per_project' },
    rateCents: { type: Number, min: 0, default: 0 },
    currency: { type: String, enum: CURRENCIES, default: 'USD', uppercase: true },
    availability: {
      type: String,
      enum: AVAILABILITIES,
      default: 'available',
      index: true,
    },
    joinedAt: { type: Date, default: () => new Date() },
    paymentMethod: { type: String, enum: PAYOUT_METHODS },
    payoutDetails: {
      type: String,
      select: false,
      set: (v) => (v ? encrypt(v) : v),
    },
    avatarUrl: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 2000 },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

teamMemberSchema.index({ name: 'text', specialties: 'text' });

export default mongoose.model('TeamMember', teamMemberSchema);
