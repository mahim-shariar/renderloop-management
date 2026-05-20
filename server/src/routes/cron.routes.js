import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { runSweep } from '../services/notification.service.js';

const router = Router();

/**
 * Time-based notification sweep — triggered by Vercel Cron (see vercel.json).
 * Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when the
 * CRON_SECRET env var is set; we reject anything else.
 */
router.get(
  '/sweep',
  asyncHandler(async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.authorization !== `Bearer ${secret}`) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const result = await runSweep();
    res.json({ success: true, data: result });
  })
);

export default router;
