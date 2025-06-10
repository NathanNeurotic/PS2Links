// Bump cache version to ensure users receive the latest files
const CACHE_NAME = 'ps2links-cache-v1'; // Changed cache name
const URLS_TO_CACHE = [
  './index.html',
  './styles.css',
  './script.js',
  './services.json',
  './favicon.ico',
  './site.webmanifest', // Corrected manifest path
  './apple-touch-icon.png', // Added apple touch icon
  './ps2wiki.ico' // Added ps2wiki.ico as it's used as a fallback
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Network first for script.js and services.json to ensure they are up-to-date
  if (requestUrl.pathname.endsWith('/script.js') || requestUrl.pathname.endsWith('/services.json')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache first for other requests
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
