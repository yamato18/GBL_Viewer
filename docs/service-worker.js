const VERSION = "0.6.0";

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
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

// フェッチイベント
self.addEventListener("fetch", (event) => {

  // 共有ファイルのPOSTリクエスト処理
  const url = new URL(event.request.url);
  if (url.pathname === "/index.html" && event.request.method === "POST") {
    event.respondWith(handleShare(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// アクティベートイベント
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
});

// バージョン取得メッセージ処理
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "GET_VERSION") {
    event.source.postMessage({ type: "VERSION", version: VERSION });
  }
});