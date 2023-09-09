import { DevicesSection } from '/components/devices-section.js';
import { PriceSection } from '/components/price-section.js';
import { fetchApiData } from '/utils/api.js';
import { registerServiceWorker } from '/utils/service-worker-registration.js';

PriceSection.update();

await fetchApiData('/devices', (/** @type {DevicesResponse} */json) => {
  DevicesSection.update(json);
});

await registerServiceWorker();
