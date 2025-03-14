// @ts-nocheck
// This is the service worker with the combined offline experience (Offline page + Offline copy of pages)

const CACHE = "takobin-offline-v1";

const offlineFallbackPage = "/offline.html";

// Install stage sets up the offline page in the cache and opens a new cache
self.addEventListener("install", function (event) {
  console.log("[PWA] Install Event processing");

  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      console.log("[PWA] Cached offline page during install");
      
      // Cache the important static assets
      return cache.addAll([
        offlineFallbackPage,
        "/",
        "/icons/icon-192x192.svg",
        "/icons/icon-512x512.svg",
        "/favicon.ico"
      ]);
    })
  );

  self.skipWaiting();
});

// If any fetch fails, it will look for the request in the cache and serve it from there first
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        console.log("[PWA] Network request for ", event.request.url);
        
        // If request was successful, add or update it in the cache
        event.waitUntil(updateCache(event.request, response.clone()));
        return response;
      })
      .catch(function () {
        console.log("[PWA] Network request Failed. Serving content from cache: " + event.request.url);
        return fromCache(event.request);
      })
  );
});

function fromCache(request) {
  // Check to see if you have it in the cache
  // Return response
  // If not in the cache, then return the offline page
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status === 404) {
        // The following validates that the request was for a navigation to a new document
        if (request.destination !== "document" || request.mode !== "navigate") {
          return Promise.reject("no-match");
        }

        return cache.match(offlineFallbackPage);
      }

      return matching;
    });
  });
}

function updateCache(request, response) {
  if (!response.ok) return;
  
  return caches.open(CACHE).then(function (cache) {
    return cache.put(request, response);
  });
}
