import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const USER_ROLES = ['admin', 'manager', 'editor', 'client'];

// Predefined security questions for the forgot-password flow.
export const SECURITY_QUESTIONS = [
  'What was the name of your first pet?',
  'What city were you born in?',
  'What was the name of your first school?',
  "What is your mother's maiden name?",
  'What was the make of your first phone or car?',
  'What is your favourite film?',
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: USER_ROLES, default: 'editor', required: true },
    avatarUrl: { type: String },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    securityQuestion: { type: String, trim: true },
    securityAnswer: { type: String, select: false }, // bcrypt hash
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.pre('save', async function hashSecurityAnswer(next) {
  if (!this.isModified('securityAnswer') || !this.securityAnswer) return next();
  this.securityAnswer = await bcrypt.hash(this.securityAnswer.toLowerCase().trim(), 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.compareSecurityAnswer = function compareSecurityAnswer(plain) {
  if (!this.securityAnswer || !plain) return Promise.resolve(false);
  return bcrypt.compare(String(plain).toLowerCase().trim(), this.securityAnswer);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const {
    _id,
    name,
    email,
    role,
    avatarUrl,
    isActive,
    lastLoginAt,
    securityQuestion,
    createdAt,
  } = this;
  return {
    id: _id.toString(),
    name,
    email,
    role,
    avatarUrl,
    isActive,
    lastLoginAt,
    securityQuestion: securityQuestion || null,
    hasSecurityQuestion: Boolean(securityQuestion),
    createdAt,
  };
};

export default mongoose.model('User', userSchema);
