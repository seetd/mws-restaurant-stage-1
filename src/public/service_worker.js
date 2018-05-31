const staticCacheName = 'rr-static-v1';
const dynamicCache = 'rr-dynamic';

const staticUrls = [
    'index.html',
    'restaurant.html',
    'service_worker_controller.js',
    'js/toast.js',    
    'js/dbhelper.js',
    'js/main.js',
    'js/restaurant_info.js',
    'css/index.min.css',
    'css/restaurant.min.css',
    'img/logo.svg',
    'data/restaurants.json',
    'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
    'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
];

const allCaches = [
    staticCacheName, dynamicCache
];

function loadCacheOrNetwork(request) {
    return caches.open(dynamicCache).then(function(cache) {
      return cache.match(request.url)
        .then(function(response) {
          var networkFetch = fetch(request).then(function(networkResponse) {
            cache.put(request.url, networkResponse.clone());
            return networkResponse;
          });
  
          return response || networkFetch;
        });
    });
  }

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
    var requestUrl = new URL(event.request.url);
    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname === '/') {
            event.respondWith(caches.match('/index.html'));
            return;
        }
    }

    event.respondWith(loadCacheOrNetwork(event.request));
});

self.addEventListener('message', function (event) {
    if (event.data && event.data.updated) {
        self.skipWaiting();
    }
});
