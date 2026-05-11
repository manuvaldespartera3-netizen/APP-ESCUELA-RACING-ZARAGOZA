// Escuela Racing Zaragoza - Service Worker v1.0
const CACHE_NAME = 'racing-zgz-v1';
const BASE_PATH = '/APP-ESCUELA-RACING-ZARAGOZA';

const ARCHIVOS_CACHE = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/admin.html',
  BASE_PATH + '/coach.html',
  BASE_PATH + '/family.html',
  BASE_PATH + '/manifest.json',
  BASE_PATH + '/icons/icon-192.png',
  BASE_PATH + '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap'
];

// ── INSTALACIÓN: cachea archivos estáticos ──
self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cacheando archivos');
        return cache.addAll(ARCHIVOS_CACHE.map(url => new Request(url, {cache: 'reload'})));
      })
      .catch(err => console.log('[SW] Error al cachear:', err))
  );
  self.skipWaiting();
});

// ── ACTIVACIÓN: limpia cachés antiguas ──
self.addEventListener('activate', event => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => {
              console.log('[SW] Eliminando caché antigua:', key);
              return caches.delete(key);
            })
      );
    })
  );
  self.clients.claim();
});

// ── FETCH: estrategia Network First para Firebase, Cache First para estáticos ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Firebase y APIs externas: siempre red (no cachear datos en tiempo real)
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firestore') ||
      url.hostname.includes('identitytoolkit')) {
    event.respondWith(fetch(event.request).catch(() => new Response('{"error":"offline"}', {headers: {'Content-Type': 'application/json'}})));
    return;
  }

  // Archivos estáticos: Cache First
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') return response;
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
            return response;
          })
          .catch(() => {
            // Offline: devuelve index.html para navegación
            if (event.request.mode === 'navigate') {
              return caches.match(BASE_PATH + '/index.html');
            }
          });
      })
  );
});

// ── NOTIFICACIONES PUSH (preparado para el futuro) ──
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || 'Nueva notificación de Racing Zaragoza',
    icon: BASE_PATH + '/icons/icon-192.png',
    badge: BASE_PATH + '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || BASE_PATH + '/' },
    actions: [
      { action: 'open', title: 'Ver' },
      { action: 'close', title: 'Cerrar' }
    ]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Escuela Racing Zaragoza', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
