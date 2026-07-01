const CACHE = 'kek-temple-v11';
const ASSETS = [
  './assets/temple.css',
  './assets/features.css',
  './assets/config.js',
  './assets/data.js',
  './assets/temple.js',
  './assets/features.js',
  './assets/codex_history.js',
  './manifest.json',
  './favicon.png',
  './kek-banner.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

function isHtmlRequest(req) {
  if (req.mode === 'navigate') return true;
  const p = new URL(req.url).pathname;
  return p.endsWith('.html') || p.endsWith('/') || !p.includes('.');
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  if (isHtmlRequest(e.request)) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => cached)
    )
  );
});