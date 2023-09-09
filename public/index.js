import { DataCharts, setBatteryInfo } from '/components/data-charts.js';
import { ConnectionBanner } from '/components/connection-banner.js';
import { EnergySection } from '/components/energy-section.js';
import { MoneySection } from '/components/money-section.js';
import { PowerSection } from '/components/power-section.js';
import { QuickSection } from '/components/quick-section.js';
import { WeatherSection } from '/components/weather-section.js';
import { fetchApiData } from '/utils/api.js';
import { registerServiceWorker } from '/utils/service-worker-registration.js';

const LIVE_UPDATE_DELAY = 10_000;
const CHART_UPDATE_DELAY = 300_000;

/** @type {DataCharts|null} */
let charts = null;
let updateCounter = 0;

/**
 * @param {NowResponse|null} data
 * @returns {Promise<void>}
 */
async function update(data = null) {
  updateCounter += LIVE_UPDATE_DELAY;
  await fetchApiData('/now', (/** @type {NowResponse} */ json) => {
    ConnectionBanner.connected();
    QuickSection.updateSource(json);
    PowerSection.update(json);
    EnergySection.update(json);
    MoneySection.update(json);
    if (
      data === null &&
      charts !== null &&
      updateCounter >= CHART_UPDATE_DELAY
    ) {
      updateCounter = 0;
      charts.update(json);
    }
  }, () => {
    ConnectionBanner.disconnected();
  });
}

await Promise.allSettled([
  fetchApiData('/history', async (/** @type {NowResponse[]} */ json) => {
    charts = new DataCharts(json);
    await update(json.at(-1));
  }, () => {
    DataCharts.error();
  }),
  fetchApiData('/devices', (/** @type {DevicesResponse} */json) => {
    setBatteryInfo(json.batteries[0]);
  }),
  fetchApiData('/weather', (/** @type {WeatherResponse} */json) => {
    QuickSection.updateWeather(json);
    // eslint-disable-next-line no-new
    new WeatherSection(json);
  }, () => {
    WeatherSection.error();
  })
]);

setInterval(update, LIVE_UPDATE_DELAY);

await registerServiceWorker();
