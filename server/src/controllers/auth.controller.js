import User, { USER_ROLES } from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../services/activity.service.js';
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  signAuthToken,
} from '../utils/tokens.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) throw ApiError.unauthorized('Invalid credentials');
  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');

  user.lastLoginAt = new Date();
  await user.save();

  const token = signAuthToken(user);
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions());
  // Token is also returned in the body so the SPA can use an Authorization
  // header — works cross-domain where third-party cookies are blocked.
  res.json({ success: true, data: { user: user.toSafeJSON(), token } });
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (role && !USER_ROLES.includes(role)) {
    throw ApiError.badRequest('Invalid role');
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw ApiError.conflict('Email already in use');
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: role || 'editor',
  });
  await logActivity({
    actor: req.user._id,
    action: role === 'client' ? 'client_invited' : 'user_invited',
    summary: `Invited ${user.name} (${user.role})`,
    entityType: 'User',
    entityId: user._id,
  });
  res.status(201).json({ success: true, data: { user: user.toSafeJSON() } });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, avatarUrl, email } = req.body;
  if (name !== undefined) req.user.name = name;
  if (avatarUrl !== undefined) req.user.avatarUrl = avatarUrl;
  if (email !== undefined && email.toLowerCase() !== req.user.email) {
    const exists = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: req.user._id },
    });
    if (exists) throw ApiError.conflict('Email already in use');
    req.user.email = email.toLowerCase();
  }
  await req.user.save();
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  const ok = await user.comparePassword(currentPassword);
  if (!ok) throw ApiError.badRequest('Current password is incorrect');
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { ...authCookieOptions(), maxAge: 0 });
  res.json({ success: true, message: 'Logged out' });
});

// ----- Security question / forgot password -----

export const setSecurityQuestion = asyncHandler(async (req, res) => {
  const { question, answer } = req.body;
  const user = await User.findById(req.user._id);
  user.securityQuestion = question;
  user.securityAnswer = answer; // hashed by the pre-save hook
  await user.save();
  res.json({ success: true, message: 'Security question saved' });
});

// Public — returns the security question for an email so the user can answer it.
export const getSecurityQuestion = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
  if (!user || !user.securityQuestion) {
    throw ApiError.notFound(
      'No security question is set for that account. Ask an admin to reset your password.'
    );
  }
  res.json({ success: true, data: { question: user.securityQuestion } });
});

// Public — verifies the security answer and sets a new password.
export const resetPasswordWithAnswer = asyncHandler(async (req, res) => {
  const { email, answer, newPassword } = req.body;
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select(
    '+password +securityAnswer'
  );
  if (!user || !user.securityQuestion) {
    throw ApiError.badRequest('Password reset is not available for that account.');
  }
  const ok = await user.compareSecurityAnswer(answer);
  if (!ok) throw ApiError.badRequest('That answer is incorrect.');
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password reset — you can sign in now.' });
});
