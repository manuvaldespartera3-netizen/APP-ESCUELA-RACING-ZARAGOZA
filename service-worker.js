// Racing Zaragoza - Service Worker v3
const CACHE = 'racing-zgz-v3';
const BASE = '/APP-ESCUELA-RACING-ZARAGOZA';

const ARCHIVOS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/admin.html',
  BASE + '/coach.html',
  BASE + '/family.html',
  BASE + '/manifest.json',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png',
];

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ARCHIVOS).catch(function(e) { console.log('[SW] Error cache:', e); });
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Firebase y APIs externas: siempre red
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') ||
      url.hostname.includes('firestore') ||
      url.hostname.includes('identitytoolkit')) {
    event.respondWith(fetch(event.request).catch(function() { return new Response(''); }));
    return;
  }

  // HTML: Network First (siempre la versión más nueva)
  if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE).then(function(cache) { cache.put(event.request, clone); });
        return response;
      }).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Resto: Cache First
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(event.request, clone); });
        }
        return response;
      });
    })
  );
});
