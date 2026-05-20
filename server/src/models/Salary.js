import mongoose from 'mongoose';

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
    amountCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, maxlength: 3 },
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
