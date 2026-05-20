// Racing Club Zaragoza — Service Worker v6
// OneSignal gestiona las notificaciones push
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Cache PWA
var CACHE = "racing-v6";
var ASSETS = [
  "/APP-ESCUELA-RACING-ZARAGOZA/",
  "/APP-ESCUELA-RACING-ZARAGOZA/index.html",
  "/APP-ESCUELA-RACING-ZARAGOZA/family.html",
  "/APP-ESCUELA-RACING-ZARAGOZA/manifest.json"
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

self.addEventListener("fetch", function(e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request);
    })
  );
});
