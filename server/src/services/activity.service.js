import ActivityLog from '../models/ActivityLog.js';

/**
 * Record an activity entry. Best-effort: a logging failure must never break
 * the originating request, so errors are swallowed.
 */
export async function logActivity({ actor, action, summary, entityType, entityId, link, meta }) {
  try {
    return await ActivityLog.create({ actor, action, summary, entityType, entityId, link, meta });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[activity] log failed:', err.message);
    return null;
  }
}

export async function listActivity({ entityType, entityId, limit = 30 } = {}) {
  const filter = {};
  if (entityType) filter.entityType = entityType;
  if (entityId) filter.entityId = entityId;
  const items = await ActivityLog.find(filter)
    .sort('-createdAt')
    .limit(Math.min(100, limit))
    .populate('actor', 'name avatarUrl')
    .lean();
  return { items };
}
