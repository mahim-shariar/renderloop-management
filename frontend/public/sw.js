/* RenderLoop service worker — handles web push notifications. */

self.addEventListener('install', (event) => {
  // Activate immediately so the first registration starts handling pushes.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_e) {
    payload = { title: 'Notification', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'RenderLoop';
  const options = {
    body: payload.body || '',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: payload.id || payload.type || 'renderloop',
    renotify: true,
    data: {
      link: payload.link || '/',
      id: payload.id,
      type: payload.type,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      // If the app is already open, focus it and tell it to navigate.
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          if ('postMessage' in client) {
            client.postMessage({ type: 'notification-click', link });
          }
          return;
        }
      }
      // Otherwise open a fresh tab pointed at the link.
      if (self.clients.openWindow) {
        await self.clients.openWindow(link);
      }
    })()
  );
});
