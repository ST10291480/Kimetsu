const CACHE = 'kitsu-shell-v1';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './extras.css',
  './mobile.css',
  './popular-anime.js',
  './app.js',
  './manifest.webmanifest',
  './icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './images/TVAnimationYuYuHakushoPoster.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('kitsu-shell-') && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = request.destination === 'image' ? await caches.match(request) : null;
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && (request.destination === 'image' || url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) {
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
        if (request.destination === 'image') {
          const images = await cache.keys();
          const cachedImages = images.filter(item => new URL(item.url).pathname.includes('/images/'));
          await Promise.all(cachedImages.slice(0, Math.max(0, cachedImages.length - 80)).map(item => cache.delete(item)));
        }
      }
      return response;
    } catch (error) {
      const fallback = await caches.match(request);
      if (fallback) return fallback;
      if (request.mode === 'navigate') return (await caches.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});
