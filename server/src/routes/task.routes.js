import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { list, get, create, update, remove } from '../controllers/task.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { TASK_STATUSES, TASK_PRIORITIES } from '../models/Task.js';

const router = Router();
router.use(authMiddleware);

const editableFields = [
  body('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('description').optional({ values: 'falsy' }).isString().isLength({ max: 5000 }),
  body('assignedTo').optional({ values: 'null' }).isMongoId(),
  body('priority').optional().isIn(TASK_PRIORITIES),
  body('dueDate').optional({ values: 'null' }).isISO8601(),
  body('status').optional().isIn(TASK_STATUSES),
  body('project').optional({ values: 'null' }).isMongoId(),
];

router.get(
  '/',
  query('scope').optional().isIn(['mine', 'all']),
  query('status').optional().isIn(TASK_STATUSES),
  validate,
  list
);

router.post(
  '/',
  body('title').isString().trim().isLength({ min: 1, max: 200 }).withMessage('Title required'),
  ...editableFields,
  validate,
  create
);

router.get('/:id', param('id').isMongoId(), validate, get);
router.patch('/:id', param('id').isMongoId(), ...editableFields, validate, update);
router.delete('/:id', param('id').isMongoId(), validate, remove);

export default router;
