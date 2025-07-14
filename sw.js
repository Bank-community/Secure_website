// Service Worker for Bank Community Loan PWA

// On install, cache some resources if needed (optional for basic setup)
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // The service worker is installed.
  // You could pre-cache assets here.
});

// On activate, clean up old caches (optional)
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
});


// The fetch event handler is required for the app to be installable.
// This basic version just passes the request to the network.
self.addEventListener('fetch', (event) => {
  // console.log('Service Worker: Fetching:', event.request.url);
  event.respondWith(fetch(event.request));
});

