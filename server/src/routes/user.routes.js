import { Router } from 'express';
import { query } from 'express-validator';
import { list } from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authMiddleware);

router.get(
  '/',
  query('role').optional().isString(),
  validate,
  list
);

export default router;
