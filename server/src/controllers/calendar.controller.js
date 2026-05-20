import { asyncHandler } from '../utils/asyncHandler.js';
import { getCalendarEvents } from '../services/calendar.service.js';

export const events = asyncHandler(async (req, res) => {
  const data = await getCalendarEvents({
    from: req.query.from,
    to: req.query.to,
    viewer: req.user,
  });
  res.json({ success: true, data });
});
