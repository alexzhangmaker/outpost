const CACHE_NAME = 'outpost_PWA_Cache';
const CACHE_FILES = [
  /*
  '/index.html',
  '/offline.html',
  '/css/style.css',
  '/js/outpost.js',
  '/images/lark192.png',
  '/images/lark512.png',
  '/images/outpost192.png',
  '/images/outpost512.png',
  */
  '/json/appConfig.json'
];
/*
// Install event: Cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_FILES);
    })
  );
  self.skipWaiting();
});

// Activate event: Cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Serve cached files or fetch from network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
        .then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
    }).catch(() => {
      // Fallback to offline page if request fails
      return caches.match('/offline.html');
    })
  );
});
*/