// Service worker d'Alif — met l'app en cache pour qu'elle marche hors ligne
// après la première visite en ligne. Incrémenter CACHE_NAME à chaque mise à
// jour du contenu pour forcer le rechargement du cache.
const CACHE_NAME = 'alif-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Stratégie : réseau d'abord (pour avoir la dernière version si en ligne),
// puis cache si hors ligne. Les appels à l'API Anthropic (conversation libre)
// ne sont jamais interceptés : ils doivent toujours passer par le réseau.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // laisse passer api.anthropic.com etc.

  event.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
  );
});
