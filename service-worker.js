const CACHE_NAME = "bor-static-v11";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./driver.html",
  "./styles.css",
  "./app.js",
  "./driver.js",
  "./supabase.js",
  "./site.webmanifest",
  "./icon-16.png",
  "./icon-32.png",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./.nojekyll",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch {
    return (await cache.match(request)) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone()).catch(() => {});
      return response;
    })
    .catch(() => cached);
  return cached || networkPromise;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isDocument = event.request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname === "/";
  event.respondWith(isDocument ? networkFirst(event.request) : staleWhileRevalidate(event.request));
});
