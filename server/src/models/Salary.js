import mongoose from 'mongoose';
import { CURRENCIES } from '../config/currencies.js';

export const SALARY_TYPES = ['monthly', 'per_project'];

const salarySchema = new mongoose.Schema(
  {
    teamMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeamMember',
      required: true,
      index: true,
    },
    type: { type: String, enum: SALARY_TYPES, default: 'monthly' },
    period: { type: String, trim: true, maxlength: 7 }, // YYYY-MM
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    // amountCents/currency are always stored in USD; the original entry is kept below.
    amountCents: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: CURRENCIES, default: 'USD', uppercase: true },
    originalAmountCents: { type: Number, min: 0 },
    originalCurrency: { type: String, enum: CURRENCIES, uppercase: true },
    exchangeRate: { type: Number, min: 0 },
    paid: { type: Boolean, default: false, index: true },
    paidAt: { type: Date },
    dueOn: { type: Date },
    transactionRef: { type: String, trim: true, maxlength: 120 },
    notes: { type: String, trim: true, maxlength: 5000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

salarySchema.index({ paid: 1, dueOn: 1 });

export default mongoose.model('Salary', salarySchema);
