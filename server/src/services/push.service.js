import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';

let configured = false;
function configure() {
  if (configured) return true;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(
    VAPID_SUBJECT || 'mailto:admin@renderloop.local',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  configured = true;
  return true;
}

export function getPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || null;
}

export async function saveSubscription(userId, sub, userAgent) {
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    throw new Error('Invalid subscription payload');
  }
  return PushSubscription.findOneAndUpdate(
    { endpoint: sub.endpoint },
    {
      user: userId,
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      userAgent,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function removeSubscription(userId, endpoint) {
  if (!endpoint) return { ok: false };
  await PushSubscription.deleteOne({ user: userId, endpoint });
  return { ok: true };
}

/**
 * Send a web push to every subscription registered for the given user.
 * Silently drops 404/410 subscriptions (browser removed them).
 */
export async function sendToUser(userId, payload) {
  if (!configure()) return { sent: 0, skipped: 'no-vapid' };
  const subs = await PushSubscription.find({ user: userId }).lean();
  if (!subs.length) return { sent: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;
  const stale = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          body,
          { TTL: 60 * 60 * 24 }
        );
        sent += 1;
      } catch (err) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          stale.push(sub.endpoint);
        } else {
          // eslint-disable-next-line no-console
          console.error('[push] send failed:', err?.statusCode, err?.body || err?.message);
        }
      }
    })
  );

  if (stale.length) {
    await PushSubscription.deleteMany({ endpoint: { $in: stale } });
  }

  return { sent, removed: stale.length };
}

export async function sendToUsers(userIds, payload) {
  const unique = [...new Set(userIds.filter(Boolean).map((id) => id.toString()))];
  return Promise.all(unique.map((id) => sendToUser(id, payload)));
}
