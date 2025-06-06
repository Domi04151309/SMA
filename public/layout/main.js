for (
  const link of /** @type {NodeListOf<HTMLAnchorElement>} */ (
    document.querySelectorAll('header a')
  )
) if (link.href === location.href) link.classList.add('selected');

if ('serviceWorker' in navigator) {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    registration.addEventListener('updatefound', () => {
      const updatedWorker = registration.installing;
      if (updatedWorker === null) return;
      updatedWorker.addEventListener('statechange', () => {
        if (
          updatedWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) updatedWorker.postMessage({ action: 'skipWaiting' }, []);
      });
    });
  } catch (error) {
    console.error('ServiceWorker registration failed:', error);
  }
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    globalThis.location.reload();
    refreshing = true;
  });
}

export {};
