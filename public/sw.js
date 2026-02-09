
// simple service worker for PWA support
const CACHE_NAME = 'rotakula-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  'https://i.imgur.com/PS0UgvO.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
