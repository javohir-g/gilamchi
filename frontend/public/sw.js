const CACHE_NAME = 'gilamchi-v5';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/maskable-icon.png',
    '/favicon.png',
    '/icons/brand-logo-v1.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force new SW to activate immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Use a more resilient approach: cache what we can, log what fails
            return Promise.allSettled(
                ASSETS_TO_CACHE.map(url =>
                    fetch(url).then(response => {
                        if (!response.ok) throw new Error(`Fetch failed for ${url}`);
                        return cache.put(url, response);
                    })
                )
            ).then(results => {
                const failed = results.filter(r => r.status === 'rejected');
                if (failed.length > 0) {
                    console.warn('Some assets failed to cache:', failed);
                }
            });
        })
    );
});

self.addEventListener('activate', (event) => {
    // Take control of all open pages immediately
    event.waitUntil(clients.claim());
    // Clean up old caches
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            )
        )
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // During development, bypass Vite internal requests and non-GET requests
    if (
        event.request.method !== 'GET' ||
        url.pathname.startsWith('/@') ||           // @vite/client, @react-refresh, etc.
        url.pathname.startsWith('/src/') ||        // Raw source files served by Vite
        url.pathname.startsWith('/node_modules/') ||
        url.hostname === '127.0.0.1' ||            // Direct backend calls
        url.port === '8000'                        // Backend API port
    ) {
        return; // Let the browser handle it normally
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
