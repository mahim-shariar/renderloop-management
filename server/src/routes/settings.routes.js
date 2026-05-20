import { Router } from 'express';
import { body } from 'express-validator';
import { get, update } from '../controllers/settings.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authMiddleware);

router.get('/', get);

router.patch(
  '/',
  roleMiddleware('admin'),
  body('agencyName').optional().isString().trim().isLength({ min: 1, max: 120 }),
  body('email').optional({ values: 'falsy' }).isEmail().normalizeEmail(),
  body('phone').optional({ values: 'falsy' }).isString().isLength({ max: 40 }),
  body('address').optional({ values: 'falsy' }).isString().isLength({ max: 400 }),
  body('logoUrl').optional({ values: 'falsy' }).isString().isLength({ max: 500 }),
  body('defaultRevisionRounds').optional().isInt({ min: 0, max: 20 }).toInt(),
  body('defaultCurrency').optional().isString().trim().isLength({ min: 3, max: 3 }),
  body('invoiceFooter').optional({ values: 'falsy' }).isString().isLength({ max: 1000 }),
  validate,
  update
);

export default router;
