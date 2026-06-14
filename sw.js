const CACHE_NAME = 'bestshop-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];
// products_db.js is cached separately on first use (it's large ~6MB)

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(STATIC_ASSETS.map(url => new Request(url, {cache:'reload'})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const networkOnly = ['firebaseio.com','firestore.googleapis.com','googleapis.com','gstatic.com','fonts.googleapis.com','fonts.gstatic.com'];
  if (networkOnly.some(h => url.hostname.includes(h))) {
    event.respondWith(fetch(event.request));
    return;
  }
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          }
          return response;
        }).catch(() => {
          if (event.request.mode === 'navigate') return caches.match('/index.html');
        });
      })
    );
  }
});
