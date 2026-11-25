// 오프라인 캐시용 서비스 워커.
// 파일을 바꾸면 CACHE_VERSION을 올려야 폰에서 새 버전이 받아져요.
const CACHE_VERSION = 'mp-v4';

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './src/app.js',
  './src/router.js',
  './src/storage.js',
  './src/ui.js',
  './src/palace-picker.js',
  './src/game.js',
  './src/fx.js',
  './src/views/home.js',
  './src/views/palace.js',
  './src/views/dictionary.js',
  './src/views/stats.js',
  './src/views/learn.js',
  './src/views/plan.js',
  './src/views/map.js',
  './src/views/profile.js',
  './src/modes/words.js',
  './src/modes/numbers.js',
  './src/modes/cards.js',
  './src/modes/numdrill.js',
  './src/modes/images.js',
  './src/modes/nback.js',
  './src/data/words-ko.js',
  './src/data/number-images.js',
  './src/data/curriculum.js',
  './src/data/images.js',
  './src/data/stages.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request))
  );
});
