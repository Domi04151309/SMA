import { DevicesSection } from '/components/devices-section.js';
import { EcologySettings } from '/components/ecology-settings.js';
import { EconomySettings } from '/components/economy-settings.js';
import { LocationSettings } from '/components/location-settings.js';
import { fetchApiData } from '/utils/api.js';

EconomySettings.update();
EcologySettings.update();
LocationSettings.update();

await fetchApiData('/devices', (/** @type {DevicesResponse} */json) => {
  DevicesSection.update(json);
});
