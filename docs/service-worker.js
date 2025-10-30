const VERSION = "0.7.0";

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

// 共有ファイル処理関数
const handleShare = async (request) => {
  const data = await request.formData();
  const file = data.get("file");
  if (file && file.name.endsWith(".glb")) {
    const fileData = await file.arrayBuffer();
    const cache = await caches.open("shared-files");
    await cache.put("/shared.glb", new Response(fileData));
  }
  return Response.redirect("./index.html");
};

// インストールイベント
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME)
        await cache.addAll(ASSETS);
        console.log("[INFO] ServiceWorker installed.");
      } catch (error) {
        console.error("[WARN] Some assets failed to cache: ", error);
      }
      self.skipWaiting();
    })());
});

// フェッチイベント
self.addEventListener("fetch", (event) => {

  // 共有ファイルのPOSTリクエスト処理
  const url = new URL(event.request.url);
  if (url.pathname === "/index.html" && event.request.method === "POST") {
    event.respondWith(handleShare(event.request));
    return;
  }

  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        }
        console.log("[INFO] ServiceWorker fetched.");
        return response;
      } catch (error) {
        const resource = await caches.match(event.request);
        if (resource) {
          console.log(`[WARN] ServiceWorker fetch failed, using cache: ${event.request.url}`);
          return resource;
        }
        console.error(`[ERROR] ServiceWorker fetch failed, no cache available: ${event.request.url}`);
        return new Response(null, { status: 404 });
      }
    })(),
  );
});

// アクティベートイベント
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME && name !== "shared-files") {
            return  caches.delete(name);
          }
        }),
      );
      await clients.claim();
    })()
  );
  console.log("[INFO] ServiceWorker activated.");
});

// バージョン取得メッセージ処理
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "GET_VERSION") {
    event.source.postMessage({ type: "VERSION", version: VERSION });
  }
});