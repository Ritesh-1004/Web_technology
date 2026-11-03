// sw.js — minimal app-shell cache for CleanCity.
// Caches the built app shell on install and falls back to it when the
// network is unavailable, so a page reload while offline doesn't show a
// blank screen. Intentionally simple — no per-report data is cached here;
// reports live in localStorage, not in this cache.
const CACHE_NAME = 'cleancity-shell-v2';
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Only handle this site's own files. The image model (CDN / Hugging Face)
  // is large and is cached by the browser itself, so we leave it alone.
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached || caches.match('/index.html'))
    )
  );
});
