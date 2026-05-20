import { Router } from 'express';
import { param, query } from 'express-validator';
import { list, markRead, markAllRead, sweep } from '../controllers/notification.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authMiddleware);

router.get('/', query('unreadOnly').optional().isBoolean(), validate, list);
router.post('/read-all', markAllRead);
router.post('/sweep', roleMiddleware('admin', 'manager'), sweep);
router.patch('/:id/read', param('id').isMongoId(), validate, markRead);

export default router;
