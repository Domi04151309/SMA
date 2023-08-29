const CACHE_NAME = 'solar-cache';

async function fetchManagement(event) {
  const offlineCache = await caches.open(CACHE_NAME);
  const cachedResult = await offlineCache.match(event.request);
  try {
    const result = await fetch(event.request);
    if (event.request.url.includes('/api/')) return result;
    else if (
      result.status === 200 && await offlineCache.match(event.request)
    ) await offlineCache.put(event.request, result.clone());
    else if (
      result.status === 304
    ) return cachedResult || result;
    else if (
      event.request.url.indexOf('http') === 0 &&
      event.request.method === 'GET'
    ) await offlineCache.put(event.request, result.clone());
    return result;
  } catch {
    const offlinePage = await offlineCache.match(event.request);
    if (!offlinePage) throw new Error('Page not in offline cache');
    return offlinePage;
  }
}

self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(fetchManagement(event));
});

self.addEventListener('activate', event => {
  const cacheWhitelist = new Set([CACHE_NAME]);
  const onActivate = async () => {
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) if (
      cacheWhitelist.has(cacheName)
      // eslint-disable-next-line no-await-in-loop
    ) await caches.delete(cacheName);
  };
  event.waitUntil(onActivate());
});
