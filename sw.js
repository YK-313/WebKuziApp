const CACHE_NAME = 'kuzi-cache-v6'; // 数字を上げる
const urlsToCache = [
    './',
    './index.html',
    './kuzigyakusan.html',
    './styles.css',
    './kuzi.js',
    './kuzigyakusan.js',
    './images/slot.gif'
];

self.addEventListener('install', function(event) {
    // 新しいバージョンが来たら待機せず即座にインストール
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

// 新しく追加：古い名前のキャッシュを削除するクリーンアップ処理
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});