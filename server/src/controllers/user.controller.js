import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.role) {
    const roles = String(req.query.role).split(',').filter(Boolean);
    filter.role = { $in: roles };
  }
  const users = await User.find(filter)
    .select('name email role avatarUrl')
    .sort({ name: 1 })
    .lean();
  res.json({ success: true, data: { items: users } });
});
