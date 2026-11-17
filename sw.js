const CACHE_NAME = 'kuzi-cache-v2';
const urlsToCache = [
    './',
    './index.html',
    './kuzigyakusan.html',
    './styles.css',
    './kuzi.js',
    './kuzigyakusan.js',
    './images/slot.gif'
];

// インストール時にファイルをキャッシュに保存
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

// オフライン時はキャッシュからファイルを返す
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});