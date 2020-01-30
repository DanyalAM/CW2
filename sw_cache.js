const cacheName = 'v2';

const cacheAssets = [
    'index.html',
    'js/script.js',
    'js/component-templates.js',
    '/image/arrow-down.png',
    '/image/csIcon.png',
    '/image/englishIcon.png',
    '/image/female-avatar.png',
    '/image/male-avatar.png',
    '/image/mathsIcon.png',
    '/image/pencils-yellowbg.jpg',
    '/image/pianoIcon.png',
    '/image/loading.jpg',
    '/image/random.png',
    '/css/style.css',
    '/page/login.html',
    '/page/myAccount.html',
    '/page/product.html',
    '/page/register.html',
    '/server.js',
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
self.addEventListener('fetch', e => {
    console.log('Service Worker: Fetching');

    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
})

//Call fetch event
//This fetches the cached content and displayd that instead 
//is unsecure because of the rest api responses it saves in cache
// self.addEventListener('fetch', function (e) {
//     e.respondWith(
//         caches.match(e.request).then(function (r) {
//             console.log('[Service Worker] Fetching resource: ' + e.request.url);
//             return r || fetch(e.request).then(function (response) {
//                 return caches.open(cacheName).then(function (cache) {
//                     console.log('[Service Worker] Caching new resource: ' + e.request.url);
//                     cache.put(e.request, response.clone());
//                     return response;
//                 });
//             });
//         })
//     );
// });