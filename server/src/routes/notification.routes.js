import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  list,
  markRead,
  markAllRead,
  sweep,
  pushKey,
  pushSubscribe,
  pushUnsubscribe,
  pushTest,
} from '../controllers/notification.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authMiddleware);

router.get('/', query('unreadOnly').optional().isBoolean(), validate, list);
router.post('/read-all', markAllRead);
router.post('/sweep', roleMiddleware('admin', 'manager'), sweep);
router.patch('/:id/read', param('id').isMongoId(), validate, markRead);

// Web Push
router.get('/push/public-key', pushKey);
router.post(
  '/push/subscribe',
  body('subscription.endpoint').isString().notEmpty(),
  body('subscription.keys.p256dh').isString().notEmpty(),
  body('subscription.keys.auth').isString().notEmpty(),
  validate,
  pushSubscribe
);
router.post(
  '/push/unsubscribe',
  body('endpoint').isString().notEmpty(),
  validate,
  pushUnsubscribe
);
router.post('/push/test', pushTest);

export default router;
