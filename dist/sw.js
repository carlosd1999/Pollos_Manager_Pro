const CACHE_NAME = 'pollos-manager-pro-v2';
const OFFLINE_FILES = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_FILES)));
});

self.addEventListener('fetch', (event) => {
  // No interceptar orígenes externos (p. ej. Supabase): evita fallos raros con CORS/preflight.
  try {
    if (new URL(event.request.url).origin !== self.location.origin) return;
  } catch {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request);
    }),
  );
});
