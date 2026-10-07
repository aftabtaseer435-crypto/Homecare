// Minimal service worker: makes the site installable and shows a friendly
// page when the phone is offline (needed for a good Android app experience).
// It does NOT cache app data — everything stays live from the server.
const CACHE = 'housingwelfare-v3';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([OFFLINE_URL, '/icons/icon-192.png'])).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return; // only page loads
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});

// ---------------------------------------------------------------- push alerts
// New order → loud, sticky notification that vibrates; tapping it opens the
// dashboard (or focuses an open tab, where the in-app alarm takes over).
self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { title: 'Housing Welfare', body: event.data ? event.data.text() : '' }; }
  const isOrder = d.kind === 'order';
  event.waitUntil(
    self.registration.showNotification(d.title || 'Housing Welfare', {
      body: d.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: d.tag || undefined,
      renotify: true,
      requireInteraction: isOrder,
      vibrate: isOrder ? [600, 200, 600, 200, 600, 200, 1200] : [200, 100, 200],
      data: { url: d.url || '/dashboard' },
      actions: isOrder ? [{ action: 'open', title: 'Order dekhein' }] : [],
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(url).catch(() => {}); return c.focus(); }
      }
      return self.clients.openWindow(url);
    }),
  );
});
