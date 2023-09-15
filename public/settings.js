import { DevicesSection } from '/components/devices-section.js';
import { LocationSection } from '/components/location-section.js';
import { PriceSection } from '/components/price-section.js';
import { fetchApiData } from '/utils/api.js';

PriceSection.update();
LocationSection.update();

await fetchApiData('/devices', (/** @type {DevicesResponse} */json) => {
  DevicesSection.update(json);
});
