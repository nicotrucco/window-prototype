/* Window — service worker.

   NETWORK-FIRST for our own files, cache only as the offline fallback.

   Cache-first meant a freshly deployed build wouldn't appear until at least the
   second launch — and on an installed iOS PWA often not even then, because
   Safari serves a stale sw.js from the HTTP cache and so never notices there's
   a new worker at all. Fresh code whenever you're online is worth the round
   trip; offline still works off the cache below.

   Registered with updateViaCache:"none" (see js/app.js) so sw.js itself is
   never served from the HTTP cache. */

const BUILD = "app-v5";
const CACHE = "window-" + BUILD;
const CORE = [
  "./", "./index.html",
  "./css/app.css",
  "./js/app.js", "./js/phrases.js", "./js/tier.js", "./js/scenes.js",
  "./js/voice.js", "./js/siriwave.js", "./js/compose.js", "./js/classify.js",
  "./manifest.webmanifest",
  "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE))
      .catch(() => {})           /* a single 404 must not block activation */
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", e => {
  if (e.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  if (url.origin === location.origin) {
    /* ours: network first, fall back to cache when offline */
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html")))
    );
  } else {
    /* fonts + tfjs CDN: stale-while-revalidate, they don't change under us */
    e.respondWith(
      caches.match(e.request).then(hit => {
        const net = fetch(e.request).then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
