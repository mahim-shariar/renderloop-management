import { Router } from 'express';
import { body } from 'express-validator';
import {
  login,
  register,
  me,
  logout,
  updateMe,
  changePassword,
  setSecurityQuestion,
  getSecurityQuestion,
  resetPasswordWithAnswer,
} from '../controllers/auth.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginLimiter, passwordResetLimiter } from '../middleware/rateLimit.js';
import { USER_ROLES, SECURITY_QUESTIONS } from '../models/User.js';

const router = Router();

router.post(
  '/login',
  loginLimiter,
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isString().isLength({ min: 1 }).withMessage('Password required'),
  validate,
  login
);

router.post(
  '/register',
  authMiddleware,
  roleMiddleware('admin'),
  body('name').isString().trim().isLength({ min: 1 }).withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isString().isLength({ min: 8 }).withMessage('Password must be 8+ chars'),
  body('role').optional().isIn(USER_ROLES).withMessage('Invalid role'),
  validate,
  register
);

router.get('/me', authMiddleware, me);
router.post('/logout', logout);

router.patch(
  '/me',
  authMiddleware,
  body('name').optional().isString().trim().isLength({ min: 1, max: 120 }),
  body('email').optional().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('avatarUrl').optional({ values: 'falsy' }).isString().isLength({ max: 500 }),
  validate,
  updateMe
);

router.post(
  '/change-password',
  authMiddleware,
  body('currentPassword').isString().isLength({ min: 1 }).withMessage('Current password required'),
  body('newPassword').isString().isLength({ min: 8 }).withMessage('New password must be 8+ chars'),
  validate,
  changePassword
);

// Security question — set while signed in
router.post(
  '/security-question',
  authMiddleware,
  body('question').isIn(SECURITY_QUESTIONS).withMessage('Pick a security question'),
  body('answer').isString().trim().isLength({ min: 2 }).withMessage('Answer required'),
  validate,
  setSecurityQuestion
);

// Forgot password — public, rate limited against brute force
router.post(
  '/forgot-password/question',
  passwordResetLimiter,
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  validate,
  getSecurityQuestion
);

router.post(
  '/forgot-password/reset',
  passwordResetLimiter,
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('answer').isString().isLength({ min: 1 }).withMessage('Answer required'),
  body('newPassword').isString().isLength({ min: 8 }).withMessage('New password must be 8+ chars'),
  validate,
  resetPasswordWithAnswer
);

export default router;
