
const CACHE_NAME = 'rotakula-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  'https://i.imgur.com/PS0UgvO.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
