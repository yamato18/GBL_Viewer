const VERSION = "0.2.0";

const CACHE_NAME = `glb-viewer-${VERSION}`;

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "https://unpkg.com/three@0.180.0/build/three.module.js",
  "https://unpkg.com/three@0.180.0/examples/jsm/controls/OrbitControls.js",
  "https://unpkg.com/three@0.180.0/examples/jsm/loaders/GLTFLoader.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
});
