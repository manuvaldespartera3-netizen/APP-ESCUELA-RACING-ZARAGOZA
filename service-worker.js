// Racing Zaragoza - Service Worker v2
// Cambia el número de versión aquí cuando quieras forzar actualización
const CACHE_VERSION = 'racing-zgz-v2';
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

// INSTALACIÓN: guarda los archivos en caché
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(ARCHIVOS).catch(err => {
        console.log('[SW] Error al cachear:', err);
      });
    })
  );
});

// ACTIVACIÓN: elimina cachés antiguas automáticamente
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_VERSION)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH: Network First para HTML (siempre intenta la versión más nueva)
// Cache First para imágenes y otros recursos estáticos
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Firebase y APIs: siempre red, nunca caché
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('gstatic.com')
  ) {
    event.respondWith(fetch(event.request).catch(() => new Response('')));
    return;
  }

  // HTML: Network First — siempre descarga la versión más nueva
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Resto: Cache First (imágenes, fuentes, iconos)
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// NOTIFICACIONES PUSH (preparado para el futuro)
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Racing Zaragoza', {
      body: data.body || '',
      icon: BASE + '/icons/icon-192.png',
      badge: BASE + '/icons/icon-72.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || BASE + '/' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
