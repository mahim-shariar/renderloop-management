import { useCallback, useEffect, useState } from 'react';
import {
  useLazyGetPushPublicKeyQuery,
  useSubscribePushMutation,
  useUnsubscribePushMutation,
} from './notificationsApi.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    /iP(hone|od|ad)/.test(navigator.platform) ||
    /iPad|iPhone|iPod/.test(ua) ||
    (/Mac/.test(navigator.platform) && navigator.maxTouchPoints > 1)
  );
}

export function isStandalonePWA() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export function isPushSupported() {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return false;
  }
  // iOS only exposes Notification/PushManager when the site is launched from
  // the Home Screen as an installed PWA (iOS 16.4+). Outside of standalone
  // mode the APIs may exist but `requestPermission` is a no-op.
  if (isIOS() && !isStandalonePWA()) return false;
  return true;
}

/**
 * Manages the user's web push subscription state. Returns a `permission`,
 * `subscribed` flag, and `enable`/`disable` actions. Registers /sw.js lazily.
 */
export function usePushNotifications() {
  const supported = isPushSupported();
  const ios = isIOS();
  const standalone = isStandalonePWA();
  // iOS Safari blocks push outside the installed PWA — surface this so the UI
  // can show "Add to Home Screen" instructions instead of a useless button.
  const needsIOSInstall = ios && !standalone;
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fetchKey] = useLazyGetPushPublicKeyQuery();
  const [subscribePush] = useSubscribePushMutation();
  const [unsubscribePush] = useUnsubscribePushMutation();

  const refresh = useCallback(async () => {
    if (!supported) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!reg) {
        setSubscribed(false);
        return;
      }
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {
      setSubscribed(false);
    }
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    // Register the service worker once on mount so push events can be received
    // as soon as a subscription exists.
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => refresh())
      .catch(() => {});

    function onMessage(event) {
      const data = event.data;
      if (data?.type === 'notification-click' && data.link) {
        window.location.assign(data.link);
      }
    }
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [supported, refresh]);

  const enable = useCallback(async () => {
    if (needsIOSInstall) return { ok: false, reason: 'ios-install-required' };
    if (!supported) return { ok: false, reason: 'unsupported' };
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return { ok: false, reason: 'denied' };

      const reg =
        (await navigator.serviceWorker.getRegistration('/sw.js')) ||
        (await navigator.serviceWorker.register('/sw.js'));
      await navigator.serviceWorker.ready;

      const { data } = await fetchKey();
      const publicKey = data?.data?.publicKey;
      if (!publicKey) return { ok: false, reason: 'no-vapid-key' };

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
      await subscribePush(sub.toJSON()).unwrap();
      setSubscribed(true);
      return { ok: true };
    } catch (err) {
      return { ok: false, reason: err?.message || 'error' };
    } finally {
      setLoading(false);
    }
  }, [supported, fetchKey, subscribePush]);

  const disable = useCallback(async () => {
    if (!supported) return { ok: false };
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = reg && (await reg.pushManager.getSubscription());
      if (sub) {
        await unsubscribePush(sub.endpoint).unwrap().catch(() => {});
        await sub.unsubscribe();
      }
      setSubscribed(false);
      return { ok: true };
    } finally {
      setLoading(false);
    }
  }, [supported, unsubscribePush]);

  return {
    supported,
    ios,
    standalone,
    needsIOSInstall,
    permission,
    subscribed,
    loading,
    enable,
    disable,
    refresh,
  };
}
