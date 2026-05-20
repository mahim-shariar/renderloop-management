import { Router } from 'express';
import { CURRENCIES } from '../config/currencies.js';
import { body, param, query } from 'express-validator';
import {
  list,
  get,
  create,
  update,
  remove,
  setStatus,
  addFootage,
  removeFootage,
  addDraft,
  updateDraftFeedback,
  removeDraft,
} from '../controllers/project.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  VIDEO_TYPES,
  ASPECT_RATIOS,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
} from '../models/Project.js';

const router = Router();
router.use(authMiddleware);

const isManager = roleMiddleware('admin', 'manager');
const isStaff = roleMiddleware('admin', 'manager', 'editor');

const editableFields = [
  body('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('client').optional().isMongoId(),
  body('projectManager').optional({ values: 'null' }).isMongoId(),
  body('assignedEditors').optional().isArray(),
  body('assignedEditors.*.user').optional().isMongoId(),
  body('assignedEditors.*.role').optional().isString().trim().isLength({ max: 50 }),
  body('assignedEditors.*.payoutCents').optional({ values: 'null' }).isInt({ min: 0 }).toInt(),
  body('videoType').optional().isIn(VIDEO_TYPES),
  body('aspectRatio').optional().isIn(ASPECT_RATIOS),
  body('targetDurationSec').optional({ values: 'null' }).isInt({ min: 0 }).toInt(),
  body('actualDurationSec').optional({ values: 'null' }).isInt({ min: 0 }).toInt(),
  body('platform').optional({ values: 'falsy' }).isString().trim().isLength({ max: 80 }),
  body('budgetCents').optional({ values: 'null' }).isInt({ min: 0 }).toInt(),
  body('currency').optional().isIn(CURRENCIES),
  body('deadline').optional({ values: 'null' }).isISO8601(),
  body('priority').optional().isIn(PROJECT_PRIORITIES),
  body('status').optional().isIn(PROJECT_STATUSES),
  body('revisionRoundsAllowed').optional({ values: 'null' }).isInt({ min: 0, max: 20 }).toInt(),
  body('revisionRoundsUsed').optional({ values: 'null' }).isInt({ min: 0 }).toInt(),
  body('finalDeliveryLink').optional({ values: 'falsy' }).isString().isLength({ max: 500 }),
  body('thumbnailUrl').optional({ values: 'falsy' }).isString().isLength({ max: 500 }),
  body('clientBrief').optional({ values: 'falsy' }).isString().isLength({ max: 20000 }),
  body('internalNotes').optional({ values: 'falsy' }).isString().isLength({ max: 20000 }),
  body('tags').optional().isArray(),
  body('tags.*').optional().isString().trim().isLength({ max: 40 }),
];

router.get(
  '/',
  query('status').optional().isString(),
  query('priority').optional().isIn(PROJECT_PRIORITIES),
  query('videoType').optional().isIn(VIDEO_TYPES),
  query('clientId').optional().isMongoId(),
  query('editorId').optional().isMongoId(),
  query('deadlineFrom').optional().isISO8601(),
  query('deadlineTo').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  validate,
  list
);

router.post(
  '/',
  isManager,
  body('title').isString().trim().isLength({ min: 1, max: 200 }).withMessage('Title required'),
  body('client').isMongoId().withMessage('Client required'),
  ...editableFields,
  validate,
  create
);

router.get('/:id', param('id').isMongoId(), validate, get);

router.patch(
  '/:id',
  isStaff,
  param('id').isMongoId(),
  ...editableFields,
  validate,
  update
);

router.patch(
  '/:id/status',
  isStaff,
  param('id').isMongoId(),
  body('status').isIn(PROJECT_STATUSES),
  validate,
  setStatus
);

router.delete(
  '/:id',
  roleMiddleware('admin', 'manager'),
  param('id').isMongoId(),
  validate,
  remove
);

router.post(
  '/:id/footage',
  isStaff,
  param('id').isMongoId(),
  body('url').isString().trim().isLength({ min: 1, max: 500 }),
  body('label').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }),
  validate,
  addFootage
);

router.delete(
  '/:id/footage/:linkId',
  isStaff,
  param('id').isMongoId(),
  param('linkId').isMongoId(),
  validate,
  removeFootage
);

router.post(
  '/:id/drafts',
  isStaff,
  param('id').isMongoId(),
  body('url').isString().trim().isLength({ min: 1, max: 500 }),
  validate,
  addDraft
);

router.patch(
  '/:id/drafts/:draftId',
  isStaff,
  param('id').isMongoId(),
  param('draftId').isMongoId(),
  body('clientFeedback').isString().isLength({ max: 20000 }),
  validate,
  updateDraftFeedback
);

router.delete(
  '/:id/drafts/:draftId',
  isStaff,
  param('id').isMongoId(),
  param('draftId').isMongoId(),
  validate,
  removeDraft
);

export default router;
