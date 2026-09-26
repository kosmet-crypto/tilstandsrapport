/* Offline support. Bump VERSION whenever any file in SHELL changes. */
const VERSION = 'bolig-v1';
const SHELL = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './vendor/alpine.min.js',
  './vendor/signature_pad.min.js',
  './vendor/jspdf.umd.min.js',
  './vendor/jspdf.plugin.autotable.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first so updates arrive; the cache answers when offline.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    // no-cache: revalidate with the server so a fresh deploy is never hidden by the HTTP cache.
    // (A navigate request cannot be re-wrapped with options, so fetch its URL instead.)
    (req.mode === 'navigate'
      ? fetch(req.url, { cache: 'no-cache' })
      : fetch(req, { cache: req.cache === 'no-store' ? 'no-store' : 'no-cache' }))
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
