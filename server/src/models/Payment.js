import mongoose from 'mongoose';

export const PAYMENT_SOURCES = [
  'client_direct',
  'fiverr',
  'upwork',
  'wise',
  'payoneer',
  'paypal',
  'crypto',
  'other',
];

export const PAYMENT_STATUSES = ['pending', 'received', 'failed'];

const paymentSchema = new mongoose.Schema(
  {
    amountCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, maxlength: 3 },
    date: { type: Date, required: true, default: () => new Date(), index: true },
    source: {
      type: String,
      enum: PAYMENT_SOURCES,
      default: 'client_direct',
      index: true,
    },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
    invoiceNumber: { type: String, trim: true, maxlength: 50 },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'received',
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 5000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

paymentSchema.index({ date: -1, status: 1 });

export default mongoose.model('Payment', paymentSchema);
