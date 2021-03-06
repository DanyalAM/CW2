var cacheName = 'v1';

// var cacheAssets = [
//     '/../index.html',
//     '/../js/script.js',
//     '/../js/component-templates.js',
//     '/../image/arrow-down.png',
//     '/../image/csIcon.png',
//     '/../image/englishIcon.png',
//     '/../image/female-avatar.png',
//     '/../image/male-avatar.png',
//     '/../image/mathsIcon.png',
//     '/../image/pencils-yellowbg.jpg',
//     '/../image/pianoIcon.png',
//     '/../image/loading.jpg',
//     '/../image/random.png',
//     '/../image/artIcon.png',
//     '/../image/culinaryIcon.png',
//     '/../image/danceIcon.png',
//     '/../image/scienceIcon.png',
//     '/../image/theaterIcon.png',
//     '/../css/style.css',
//     '/../page/login.html',
//     '/../page/myAccount.html',
//     '/../page/product.html',
//     '/../page/register.html',
//     '/../server.js',
//     '/../icons/icon-32.png',
//     '/../icons/icon-64.png',
//     '/../icons/icon-128.png',
//     '/../icons/icon-256.png',
//     '/../icons/icon-512.png',
// ];

//for github
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
    '/CW2/image/artIcon.png',
    '/CW2/image/culinaryIcon.png',
    '/CW2/image/danceIcon.png',
    '/CW2/image/scienceIcon.png',
    '/CW2/image/theaterIcon.png',
    '/CW2/css/style.css',
    '/CW2/page/login.html',
    '/CW2/page/myAccount.html',
    '/CW2/page/product.html',
    '/CW2/page/register.html',
    '/CW2/server.js',
    '/CW2/icons/icon-32.png',
    '/CW2/icons/icon-64.png',
    '/CW2/icons/icon-128.png',
    '/CW2/icons/icon-256.png',
    '/CW2/icons/icon-512.png',
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

//push notifications with the body and icon received in json
self.addEventListener('push', function (event) {
    var jsonData = JSON.parse(event.data.text());
    //console.log(jsonData);
    const title = 'Brain Hive';

    event.waitUntil(self.registration.showNotification(title, jsonData));
});


//Call fetch event
//This fetches the cached content and displayd that instead 
//is unsecure because of the rest api responses it saves in cache
var online = true;

self.addEventListener('fetch', function (e) {

    if (e.request.method != "PUT") {
        //dont save the service worker 
        if (e.request != "https://danyalam.github.io/CW2/sw_cache.js") {
            e.respondWith(
                caches.match(e.request).then(function (r) {
                    //console.log('[Service Worker] Fetching resource: ' + e.request.url);

                    //use something that isn't in cache to test if we're online or offline
                    fetch("https://danyalam.github.io/CW2/sw_cache.js").then(response => {
                        online = true;
                    }).catch(() => {
                        console.log("IT WILL NOT LOAD!!!");
                        online = false;
                    })

                    //we need the products and user objects to be updated at every change
                    //but GET requests include files from our root folder, so we'll have to specify we want only
                    //cors type requests to be caught here
                    if (r != undefined && r.type == "cors" && e.request.method == "POST" || r != undefined && r.type == "cors" && e.request.method == "GET") {
                        //we dont want to call the fetch requests from the cache
                        //because they will constantly be updated with new products and ratings

                        //if offline dont delete the products object
                        if (online) {
                            caches.delete(e.request);
                            r = undefined;
                        }
                    }

                    //if we're online then r will be set to undefined to always allow
                    //products and users to be updated
                    //however if we're offline they will not be undefined
                    //and that will stop them from causing GET errors
                    return r || fetch(e.request).then(function (response) {
                        return caches.open(cacheName).then(function (cache) {
                            //console.log('[Service Worker] Caching new resource: ' + e.request.url);
                            if (e.request.method != "DELETE" || e.request.method != "POST") {
                                cache.put(e.request, response.clone());
                            }
                            return response;
                        }).catch(error => {
                            console.log("[Service Worker Error]: " + error)
                        })
                    })
                }).catch(error => {
                    console.log("[Service Worker Error]: " + error)
                })
            );
        }
    }
});