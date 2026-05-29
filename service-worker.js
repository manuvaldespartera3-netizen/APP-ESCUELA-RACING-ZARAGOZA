// Racing Club Zaragoza — Service Worker v7
// OneSignal gestiona las notificaciones push
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Cache PWA
var CACHE = "racing-v7";
var ASSETS = [
  "/",
  "/index.html",
  "/admin.html",
  "/coach.html",
  "/family.html",
  "/manifest.json",
  "/icons/icon-192.png"
];

self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(ASSETS);
    }).catch(function() {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Network-first: siempre intenta red primero (para coger versiones nuevas).
// Si falla (offline), tira del cache.
self.addEventListener("fetch", function(e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request);
    })
  );
});
