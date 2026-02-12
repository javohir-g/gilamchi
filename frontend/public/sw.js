const CACHE_NAME = 'gilamchi-v4';
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

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
