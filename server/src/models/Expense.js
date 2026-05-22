import mongoose from 'mongoose';
import { CURRENCIES } from '../config/currencies.js';

export const EXPENSE_CATEGORIES = [
  'team_salary',
  'software_subscription',
  'ads',
  'equipment',
  'stock_assets',
  'misc',
];

const expenseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    // amountCents/currency are always stored in USD; the original entry is kept below.
    amountCents: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: CURRENCIES, default: 'USD', uppercase: true },
    originalAmountCents: { type: Number, min: 0 },
    originalCurrency: { type: String, enum: CURRENCIES, uppercase: true },
    exchangeRate: { type: Number, min: 0 },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      default: 'misc',
      index: true,
    },
    date: { type: Date, required: true, default: () => new Date(), index: true },
    paid: { type: Boolean, default: true },
    recurring: { type: Boolean, default: false },
    notes: { type: String, trim: true, maxlength: 5000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

expenseSchema.index({ date: -1, category: 1 });

export default mongoose.model('Expense', expenseSchema);
