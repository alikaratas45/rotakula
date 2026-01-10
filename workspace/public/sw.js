// This is a basic service worker to make the app installable.

self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  // You can pre-cache assets here if needed.
});

self.addEventListener('fetch', (event) => {
  // This basic fetch handler is sufficient for PWA installability.
  // For offline functionality, you would add more complex caching strategies here.
  event.respondWith(fetch(event.request));
});
