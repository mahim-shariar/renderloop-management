import { Router } from 'express';
import { overview, analytics, myDashboard } from '../controllers/insights.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Personal dashboard — any signed-in user (editor's own progress).
router.get('/my-dashboard', myDashboard);
// Overview & analytics expose agency-wide revenue/profit — staff only.
router.get('/overview', roleMiddleware('admin', 'manager'), overview);
router.get('/analytics', roleMiddleware('admin', 'manager'), analytics);

export default router;
