// Bump cache version to ensure users receive the latest files
const CACHE_NAME = 'ps2links-cache-v1';
const URLS_TO_CACHE = [
  './index.html',
  './styles.css',
  './script.js',
  './links.json',
  './favicon.ico',
  './public/manifest.json'
];
self.CACHE_NAME = globalThis.CACHE_NAME = CACHE_NAME;
self.URLS_TO_CACHE = globalThis.URLS_TO_CACHE = URLS_TO_CACHE;

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(URLS_TO_CACHE);
      try {
        const resp = await fetch('./links.json');
        const services = await resp.json();
        for (const svc of services) {
          if (svc.favicon_url) {
            try { await cache.add(svc.favicon_url); } catch (e) { /* ignore */ }
          }
          if (svc.thumbnail_url) {
            try { await cache.add(svc.thumbnail_url); } catch (e) { /* ignore */
 }
          }
        }
      } catch (err) {
        console.error('Failed to cache service assets', err);
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delet
e(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // const requestUrl = new URL(event.request.url);
  const requestUrl = event.request.url;

  // Network first for script.js and links.json
  if (requestUrl.endsWith('/script.js') || requestUrl.endsWith('/links.json')
) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache first for other requests
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request
))
  );
});
