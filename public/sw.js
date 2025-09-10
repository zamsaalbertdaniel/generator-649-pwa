const VERSION = 'v1';
const CORE = ['/', '/offline.html', '/icons/icon-192.png', '/icons/icon-512.png', '/manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { request } = e;

  if (request.mode === 'navigate') {
    e.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
    return;
  }

  const url = new URL(request.url);
  if (CORE.includes(url.pathname)) {
    e.respondWith(caches.match(request).then(r => r || fetch(request)));
    return;
  }

  e.respondWith(fetch(request).catch(() => caches.match(request)));
});
