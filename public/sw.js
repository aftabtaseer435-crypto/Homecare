// Minimal service worker: makes the site installable and shows a friendly
// page when the phone is offline (needed for a good Android app experience).
// It does NOT cache app data — everything stays live from the server.
const CACHE = 'societyhub-v1';
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
