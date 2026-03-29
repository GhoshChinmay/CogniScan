const CACHE_NAME = "cogniscan-v1";
const OFFLINE_URL = "/";

// Basic offline caching
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Don't fully cache everything dynamically or it's hard to
      // maintain, but caching the offline fallback is simple
      return cache.add(OFFLINE_URL);
    })
  );
  // Force active
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Network-first strategy for the app with fallback
self.addEventListener("fetch", (event) => {
  // Only handle GET requests for navigation/assets
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      // If network fails (offline), load from cache
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // If it's a page navigation request, return offline root
      if (event.request.mode === "navigate") {
        const rootResponse = await cache.match(OFFLINE_URL);
        if (rootResponse) {
          return rootResponse;
        }
      }
      return Response.error();
    })
  );
});
