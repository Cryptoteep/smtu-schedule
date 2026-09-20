// Service Worker for SPbGMTU Schedule App (Корабелка)
// Version 1.5.0 - Network-First for HTML navigation to ensure instant updates
const CACHE_NAME = 'smtu-schedule-v1.5.0';

self.addEventListener('install', (event) => {
  const scope = self.registration.scope;
  const assetsToCache = [
    scope,
    new URL('index.html', scope).href,
    new URL('manifest.json', scope).href,
    new URL('favicon.svg', scope).href,
    new URL('download.html', scope).href,
  ];

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(assetsToCache))
      .catch((err) => {
        console.warn('SW cache.addAll notice:', err);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('[SW] Purging outdated cache:', key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && (event.data.action === 'skipWaiting' || event.data === 'skipWaiting')) {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = request.url;

  // 1. Navigation requests (HTML pages): NETWORK-FIRST
  // Guarantees users always get the latest release when online, falling back to cache when offline.
  const isNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && request.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return (
            (await caches.match('./index.html')) ||
            (await caches.match('/index.html')) ||
            (await caches.match(self.registration.scope))
          );
        })
    );
    return;
  }

  // 2. Dynamic schedule data & API requests: NETWORK-FIRST with cache fallback
  if (url.includes('/api/') || url.includes('/data/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && request.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 3. Static assets (hashed JS, CSS, images): Cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        if (response.ok && request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
