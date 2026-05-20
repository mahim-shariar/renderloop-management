import { Router } from 'express';
import { query } from 'express-validator';
import { list } from '../controllers/activity.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authMiddleware);

router.get(
  '/',
  query('entityType').optional().isString(),
  query('entityId').optional().isMongoId(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  list
);

export default router;
