// Racing Club Zaragoza — Service Worker v5 (FCM Push)
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAKHHJ-7fT-KS0F0CTvtVgssxCQcAhBIs8",
  authDomain: "escuela-racing-zaragoza.firebaseapp.com",
  projectId: "escuela-racing-zaragoza",
  storageBucket: "escuela-racing-zaragoza.firebasestorage.app",
  messagingSenderId: "862620560075",
  appId: "1:862620560075:web:51c178f8893bbd5fb1494e"
});

const messaging = firebase.messaging();

// Notificaciones cuando la app está en SEGUNDO PLANO o CERRADA
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Notificación en background:', payload);
  var data = payload.data || {};
  var notificationTitle = data.titulo || payload.notification && payload.notification.title || 'Racing Club Zaragoza';
  var notificationOptions = {
    body: data.mensaje || payload.notification && payload.notification.body || '',
    icon: '/APP-ESCUELA-RACING-ZARAGOZA/icons/icon-192.png',
    badge: '/APP-ESCUELA-RACING-ZARAGOZA/icons/icon-72.png',
    tag: data.tipo || 'general',
    data: { url: data.url || '/APP-ESCUELA-RACING-ZARAGOZA/family.html' },
    actions: [{ action: 'abrir', title: 'Ver' }]
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click en notificación → abrir app
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/APP-ESCUELA-RACING-ZARAGOZA/family.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].url.includes('family.html') && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Cache para PWA
var CACHE = 'racing-v5';
var ASSETS = [
  '/APP-ESCUELA-RACING-ZARAGOZA/',
  '/APP-ESCUELA-RACING-ZARAGOZA/index.html',
  '/APP-ESCUELA-RACING-ZARAGOZA/family.html',
  '/APP-ESCUELA-RACING-ZARAGOZA/coach.html',
  '/APP-ESCUELA-RACING-ZARAGOZA/manifest.json'
];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(ASSETS); }).catch(function(){}));
  self.skipWaiting();
});
self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }));
  self.clients.claim();
});
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(function() { return caches.match(e.request); })
  );
});
