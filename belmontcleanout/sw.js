/* BelmontCleanout service worker.
 *
 * Served from <basePath>/sw.js (static export; basePath is '' on the
 * root-domain deploy belmontcleanout.com and '/belmontcleanout' on the
 * legacy subpath deploy), so its scope is the whole app. Registered by
 * components/PwaProvider.tsx.
 *
 * Responsibilities:
 *   1. Offline shell — precache the app shell + icons; navigations are
 *      network-first with a cached fallback, static assets cache-first.
 *      Supabase (API/storage) requests are never intercepted.
 *   2. Web Push — `push` shows a notification (payload JSON from the
 *      send-push edge function: {title, body, url}); `notificationclick`
 *      focuses an open tab or opens the target URL.
 */

// Derived from the worker's own URL (it always lives at <basePath>/sw.js), so
// the same file works for both the root-domain and subpath deploys. '' at the
// domain root, '/belmontcleanout' on the legacy subpath deploy.
const BASE_PATH = self.location.pathname.replace(/\/sw\.js$/, '');
// Bump to invalidate old caches on deploy.
const CACHE_NAME = 'cc-shell-v1';

const PRECACHE_URLS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/manifest.webmanifest`,
  `${BASE_PATH}/icon.svg`,
  `${BASE_PATH}/icons/icon-192.png`,
  `${BASE_PATH}/icons/icon-512.png`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // addAll would reject the whole install on one 404; cache best-effort.
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle same-origin app requests — never Supabase auth/data/storage.
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE_PATH)) return;

  if (request.mode === 'navigate') {
    // Pages: network-first (fresh listings), cache fallback when offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(`${BASE_PATH}/`))
            .then((cached) => cached || Response.error()),
        ),
    );
    return;
  }

  // Static assets (hashed _next chunks, icons, seed images): cache-first.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});

/* ---- Web Push ----------------------------------------------------------- */

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'BelmontCleanout', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'BelmontCleanout';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: `${BASE_PATH}/icons/icon-192.png`,
      badge: `${BASE_PATH}/icons/icon-192.png`,
      data: { url: data.url || `${BASE_PATH}/` },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(
    (event.notification.data && event.notification.data.url) || `${BASE_PATH}/`,
    self.location.origin,
  ).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Reuse an open app tab when there is one.
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin + BASE_PATH) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
