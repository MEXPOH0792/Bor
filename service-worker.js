const CACHE_NAME = "bor-static-v10";
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

function isHtmlRequest(request) {
  return request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html");
}

async function putInCache(request, response) {
  if (!response || response.status !== 200 || response.type === "opaque") {
    return response;
  }

  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone()).catch(() => {});
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (isHtmlRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => putInCache(event.request, response))
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          return cachedResponse || caches.match("./index.html");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((response) => putInCache(event.request, response))
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
