import { Router } from 'express';
import { query } from 'express-validator';
import { events } from '../controllers/calendar.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authMiddleware);

router.get(
  '/events',
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  validate,
  events
);

export default router;
