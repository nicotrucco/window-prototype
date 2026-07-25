/* Window — service worker: cache the shell, keep fonts/model available offline-ish */
/* Bump CACHE on every deploy — an installed PWA will happily serve the old shell
   forever otherwise, and you'll film the previous build without noticing. */
const CACHE = "window-v4-blocker";
const CORE = [
  "./", "./index.html",
  "./css/app.css",
  "./js/app.js", "./js/phrases.js", "./js/scenes.js",
  "./js/voice.js", "./js/compose.js", "./js/classify.js",
  "./img/frame-tall.png", "./img/frame-open-tall.png",
  "./manifest.webmanifest",
  "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  if (url.origin === location.origin) {
    /* shell: cache-first, refresh in background */
    e.respondWith(
      caches.match(e.request).then(hit => {
        const net = fetch(e.request).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  } else {
    /* fonts + tfjs CDN: stale-while-revalidate */
    e.respondWith(
      caches.match(e.request).then(hit => {
        const net = fetch(e.request).then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
