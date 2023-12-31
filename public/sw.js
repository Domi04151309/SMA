const CACHE_NAME = 'solar-cache';

/**
 * @param {{request: Request}} event
 * @returns {Promise<Response>}
 */
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
    if (!offlinePage) return new Response();
    return offlinePage;
  }
}

self.addEventListener('message', event => {
  // @ts-expect-error Missing worker types in context
  if (event.data.action === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  // @ts-expect-error Missing worker types in context
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
  // @ts-expect-error Missing worker types in context
  event.waitUntil(onActivate());
});
