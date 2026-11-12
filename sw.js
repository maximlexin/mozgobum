// Офлайн-кэш. При изменении файлов игры поднимай VERSION, чтобы телефоны получили обновление.
const VERSION = 'mozgobum-v44';
const FILES = [
  './', 'index.html', 'styles.css', 'manifest.webmanifest', 'icons/icon.svg', 'fonts/nunito.css', 'fonts/nunito-cyrillic-ext.woff2', 'fonts/nunito-cyrillic.woff2', 'fonts/nunito-latin-ext.woff2', 'fonts/nunito-latin.woff2', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/util.js', 'js/config.js', 'js/cloud.js', 'js/pay.js', 'js/content-math.js', 'js/content-geometry.js', 'js/content-russian.js',
  'js/content-physics.js', 'js/content-biology.js', 'js/theory-math.js', 'js/theory-geometry.js', 'js/theory-russian.js', 'js/theory-physics.js', 'js/theory-biology.js', 'js/mascot.js', 'js/scene.js', 'js/sound.js', 'js/app.js',
];

self.addEventListener('install', e => {
  const requests = FILES.map(file => new Request(new URL(file, self.registration.scope), { cache: 'reload' }));
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(requests)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => /^mozgobum-v\d+$/.test(k) && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Сначала сеть (чтобы обновления приходили сразу), без сети — кэш.
// Запросы к серверу (Supabase, ЮKassa) не трогаем: их нельзя отдавать из кэша.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const gameRoot = new URL('./', self.registration.scope);
  if (!url.pathname.startsWith(gameRoot.pathname)) return;
  const isEntry = url.pathname === gameRoot.pathname ||
    url.pathname === new URL('index.html', gameRoot).pathname;
  const cacheKey = isEntry ? gameRoot.href : e.request;
  if (!isEntry && url.search) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    let response;
    try {
      response = await fetch(isEntry ? gameRoot.href : e.request, { cache: 'no-cache' });
    } catch (error) {
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
      throw error;
    }
    if (response.ok && response.status !== 206) {
      e.waitUntil(cache.put(cacheKey, response.clone()).catch(() => {}));
    }
    return response;
  })());
});
