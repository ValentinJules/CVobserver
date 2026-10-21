const CACHE = 'obs-cv-v2';
const ASSETS = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();               // active immédiatement le nouveau SW
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())   // prend le contrôle des onglets ouverts
  );
});

self.addEventListener('fetch', e => {
  // Navigation / HTML → network-first (toujours à jour)
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Assets → cache-first (rapide)
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});