import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  list,
  get,
  create,
  update,
  remove,
  addNote,
  removeNote,
} from '../controllers/client.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  CLIENT_STATUSES,
  PAYMENT_METHODS,
  SOCIAL_PLATFORMS,
} from '../models/Client.js';

const router = Router();
router.use(authMiddleware);
// Client data is staff-only — editors/clients have no business browsing the roster.
router.use(roleMiddleware('admin', 'manager'));

const isManager = roleMiddleware('admin', 'manager');

const baseFields = [
  body('name').optional().isString().trim().isLength({ min: 1, max: 120 }),
  body('company').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }),
  body('email').optional({ values: 'falsy' }).isEmail().normalizeEmail(),
  body('phone').optional({ values: 'falsy' }).isString().trim().isLength({ max: 40 }),
  body('country').optional({ values: 'falsy' }).isString().trim().isLength({ max: 80 }),
  body('timezone').optional({ values: 'falsy' }).isString().trim().isLength({ max: 80 }),
  body('paymentMethod').optional({ values: 'falsy' }).isIn(PAYMENT_METHODS),
  body('preferredPlatforms').optional().isArray(),
  body('preferredPlatforms.*').optional().isIn(SOCIAL_PLATFORMS),
  body('defaultRevisionRounds').optional().isInt({ min: 0, max: 20 }).toInt(),
  body('status').optional().isIn(CLIENT_STATUSES),
  body('notes').optional({ values: 'falsy' }).isString().isLength({ max: 5000 }),
  body('handles').optional().isObject(),
];

router.get(
  '/',
  query('status').optional().isIn(CLIENT_STATUSES),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  list
);

router.post(
  '/',
  isManager,
  body('name').isString().trim().isLength({ min: 1, max: 120 }).withMessage('Name required'),
  ...baseFields,
  validate,
  create
);

router.get('/:id', param('id').isMongoId(), validate, get);

router.patch(
  '/:id',
  isManager,
  param('id').isMongoId(),
  ...baseFields,
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

router.post(
  '/:id/notes',
  param('id').isMongoId(),
  body('body').isString().trim().isLength({ min: 1, max: 5000 }).withMessage('Note body required'),
  validate,
  addNote
);

router.delete(
  '/:id/notes/:noteId',
  param('id').isMongoId(),
  param('noteId').isMongoId(),
  validate,
  removeNote
);

export default router;
