// This is a basic service worker.
// It doesn't do much, but it's required for a PWA.

self.addEventListener('install', (event) => {
  // Perform install steps
  console.log('Service Worker installing.');
});

self.addEventListener('fetch', (event) => {
  // This service worker doesn't intercept fetch requests.
  // It just exists to make the app installable.
  event.respondWith(fetch(event.request));
});
