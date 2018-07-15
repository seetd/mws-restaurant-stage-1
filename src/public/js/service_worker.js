const staticCacheName = 'rr-static-v3';
const dynamicCacheName = 'rr-dynamic';

const staticUrls = [
    'index.html',
    'restaurant.html',
    'js/index.js',
    'js/restaurant.js',
    'css/index.min.css',
    'css/restaurant.min.css',
    'img/logo.svg',
    'img/noimage.png',
    'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
    'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
];

const allCaches = [
    staticCacheName, dynamicCacheName
];

const loadCacheOrNetwork = (request, requestUrl, isSameOrigin) => 
    caches.match(request)
        .then(response => response || fetch(request).then(
            networkResponse => {
                // Handle restaurant images missing
                if (
                    networkResponse.status === 404
                    && isSameOrigin
                    && requestUrl.pathname.startsWith('/img')
                    && requestUrl.pathname.endsWith('.jpg')
                ) {
                    return caches.match('img/noimage.png')
                        .then(noimageResponse => noimageResponse);
                } else {
                    const responseClone = networkResponse.clone();
                    caches.open(dynamicCacheName).then(function (cache) {
                        cache.put(request, responseClone);
                    });
                    return networkResponse;
                }
            }
        ));

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(staticCacheName)
            .then(function (cache) {
                return cache.addAll(staticUrls);
            })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('rr-') && !allCaches.includes(cacheName);
                })
                .map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', function (event) {
    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin === location.origin) {
        // Redirect 'http://localhost:8000' to 'http://localhost:8000/index.html' since 
        // they should bascially be the same html
        if (requestUrl.pathname === '/') {
            event.respondWith(caches.match('index.html'));
            return;
        }

        // Strip all query parameters so that 'http://localhost:8000/restaurant.html?id=1' 
        // and 'http://localhost:8000/restaurant.html?id=2' are the same
        if (requestUrl.pathname.startsWith('/restaurant.html')) {
            event.respondWith(caches.match('restaurant.html'));
            return;
        }
    }

    if (event.request.url.startsWith('http://localhost:1337/restaurants')) {
        // avoid caching the API calls as those will be handle by IDB
        return;
    }
    
    event.respondWith(loadCacheOrNetwork(event.request, requestUrl, requestUrl.origin === location.origin));
});

self.addEventListener('message', function (event) {
    if (event.data && event.data.updated) {
        self.skipWaiting();
    }
});