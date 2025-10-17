const CACHE_NAME = "staysphere-cache-v2";
const urlsToCache = [
  "/manifest.json",
  "/styles/main.css"
];

// Install SW
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // Activate new SW immediately
});

// Activate SW
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }))
    )
  );
  self.clients.claim();
});

// Fetch — skip caching for dynamic or backend routes
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // ❌ Skip intercepting dynamic routes and root path
  if (
    url.pathname === "/" ||
    url.pathname.startsWith("/listings") ||
    url.pathname.startsWith("/users") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/uploads") ||
    url.pathname.startsWith("/images")
  ) {
    return; // Let the network handle these
  }

  // ✅ Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
