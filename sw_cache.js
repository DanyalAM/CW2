var cacheName = 'v2';

// if (window.location.href.indexOf("danyalam.github.io") > -1) {
//     // window.location.replace("/CW2/page/login.html");
// } else {
//     // window.location.replace("/page/login.html");
//     console.log("gsdfd");
// }
// /CW2/index.html

var cacheAssets = [
    '/CW2/index.html',
    '/CW2/js/script.js',
    '/CW2/js/component-templates.js',
    '/CW2/image/arrow-down.png',
    '/CW2/image/csIcon.png',
    '/CW2/image/englishIcon.png',
    '/CW2/image/female-avatar.png',
    '/CW2/image/male-avatar.png',
    '/CW2/image/mathsIcon.png',
    '/CW2/image/pencils-yellowbg.jpg',
    '/CW2/image/pianoIcon.png',
    '/CW2/image/loading.jpg',
    '/CW2/image/random.png',
    '/CW2/css/style.css',
    '/CW2/page/login.html',
    '/CW2/page/myAccount.html',
    '/CW2/page/product.html',
    '/CW2/page/register.html',
    '/CW2/server.js',
];

//put our files into the cache
self.addEventListener('install', (e) => {
    console.log('Service Worker: Installed');
    e.waitUntil(
        caches
            .open(cacheName)
            .then(cache => {
                console.log('Service Worker: Caching Files');
                cache.addAll(cacheAssets);
            }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    console.log('Service Worker: Activated');

    //check the cache for old cache, and remove it if it's not the current cache (cacheName variable above)
    //this allows us to update cache and give users new information if necessary
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== cacheName) {
                        console.log("Service Worker: Old Cache Deleted");
                        return caches.delete(cache);
                    }
                })
            )
        })
    )
});

//Call fetch event
// self.addEventListener('fetch', e => {
//     console.log('Service Worker: Fetching');

//     e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
// })

//Call fetch event
//This fetches the cached content and displayd that instead 
//is unsecure because of the rest api responses it saves in cache
self.addEventListener('fetch', function (e) {
    e.respondWith(
        caches.match(e.request).then(function (r) {
            console.log('[Service Worker] Fetching resource: ' + e.request.url);
            return r || fetch(e.request).then(function (response) {
                return caches.open(cacheName).then(function (cache) {
                    console.log('[Service Worker] Caching new resource: ' + e.request.url);
                    cache.put(e.request, response.clone());
                    return response;
                });
            });
        })
    );
});