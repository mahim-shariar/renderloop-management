import mongoose from 'mongoose';
import { CURRENCIES } from '../config/currencies.js';

// Singleton document — exactly one row identified by key: 'default'.
const agencySettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    agencyName: { type: String, trim: true, default: 'RenderLoop' },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    defaultRevisionRounds: { type: Number, default: 2, min: 0, max: 20 },
    defaultCurrency: { type: String, enum: CURRENCIES, default: 'USD', uppercase: true },
    invoiceFooter: {
      type: String,
      trim: true,
      default: 'Payment due within 14 days of receipt. Reference invoice number on transfer.',
    },
  },
  { timestamps: true }
);

export default mongoose.model('AgencySettings', agencySettingsSchema);
