// Офлайн-кэш. При изменении файлов игры поднимай VERSION, чтобы телефоны получили обновление.
const VERSION = 'mozgobum-v40';
const FILES = [
  './', 'index.html', 'styles.css', 'manifest.webmanifest', 'icons/icon.svg', 'fonts/nunito.css', 'fonts/nunito-cyrillic-ext.woff2', 'fonts/nunito-cyrillic.woff2', 'fonts/nunito-latin-ext.woff2', 'fonts/nunito-latin.woff2', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/util.js', 'js/config.js', 'js/cloud.js', 'js/pay.js', 'js/content-math.js', 'js/content-geometry.js', 'js/content-russian.js',
  'js/content-physics.js', 'js/content-biology.js', 'js/theory-math.js', 'js/theory-geometry.js', 'js/theory-russian.js', 'js/theory-physics.js', 'js/theory-biology.js', 'js/mascot.js', 'js/scene.js', 'js/sound.js', 'js/app.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Сначала сеть (чтобы обновления приходили сразу), без сети — кэш.
// Запросы к серверу (Supabase, ЮKassa) не трогаем: их нельзя отдавать из кэша.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // cache: 'no-cache' — всегда сверяемся с сервером, а не берём старый файл из кэша браузера
  e.respondWith(
    fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
