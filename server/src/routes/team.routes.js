import { Router } from 'express';
import { CURRENCIES } from '../config/currencies.js';
import { body, param, query } from 'express-validator';
import {
  list,
  get,
  create,
  update,
  remove,
  getMine,
  updateMine,
} from '../controllers/team.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  TEAM_ROLES,
  SALARY_TYPES,
  AVAILABILITIES,
  PAYOUT_METHODS,
} from '../models/TeamMember.js';

const router = Router();
router.use(authMiddleware);

const isManager = roleMiddleware('admin', 'manager');

const editableFields = [
  body('name').optional().isString().trim().isLength({ min: 1, max: 120 }),
  body('email').optional({ values: 'falsy' }).isEmail().normalizeEmail(),
  body('user').optional({ values: 'null' }).isMongoId(),
  body('role').optional().isIn(TEAM_ROLES),
  body('specialties').optional().isArray(),
  body('specialties.*').optional().isString().trim().isLength({ max: 40 }),
  body('salaryType').optional().isIn(SALARY_TYPES),
  body('rateCents').optional({ values: 'null' }).isInt({ min: 0 }).toInt(),
  body('currency').optional().isIn(CURRENCIES),
  body('availability').optional().isIn(AVAILABILITIES),
  body('joinedAt').optional({ values: 'null' }).isISO8601(),
  body('paymentMethod').optional({ values: 'falsy' }).isIn(PAYOUT_METHODS),
  body('payoutDetails').optional({ values: 'falsy' }).isString().isLength({ max: 5000 }),
  body('avatarUrl').optional({ values: 'falsy' }).isString().isLength({ max: 500 }),
  body('bio').optional({ values: 'falsy' }).isString().isLength({ max: 2000 }),
];

router.get(
  '/',
  isManager,
  query('role').optional().isIn(TEAM_ROLES),
  query('availability').optional().isIn(AVAILABILITIES),
  validate,
  list
);

router.post(
  '/',
  isManager,
  body('name').isString().trim().isLength({ min: 1, max: 120 }).withMessage('Name required'),
  body('role').isIn(TEAM_ROLES).withMessage('Role required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('tempPassword')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Temporary password must be at least 8 characters'),
  ...editableFields,
  validate,
  create
);

// Self-service — the signed-in user's own team profile (payout + availability).
// Declared before "/:id" so "me" isn't parsed as an id.
router.get('/me', getMine);
router.patch(
  '/me',
  body('paymentMethod').optional({ values: 'falsy' }).isIn(PAYOUT_METHODS),
  body('payoutDetails').optional({ values: 'falsy' }).isString().isLength({ max: 5000 }),
  body('availability').optional().isIn(AVAILABILITIES),
  body('bio').optional({ values: 'falsy' }).isString().isLength({ max: 2000 }),
  body('specialties').optional().isArray(),
  body('specialties.*').optional().isString().trim().isLength({ max: 40 }),
  validate,
  updateMine
);

router.get('/:id', isManager, param('id').isMongoId(), validate, get);

router.patch(
  '/:id',
  isManager,
  param('id').isMongoId(),
  body('newPassword')
    .optional({ values: 'falsy' })
    .isString()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
  ...editableFields,
  validate,
  update
);

router.delete(
  '/:id',
  roleMiddleware('admin'),
  param('id').isMongoId(),
  validate,
  remove
);

export default router;
