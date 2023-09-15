import { DataCharts, setBatteryInfo } from '/components/data-charts.js';
import { fetchApiData, fetchWeatherData } from '/utils/api.js';
import { ConnectionBanner } from '/components/connection-banner.js';
import { EnergySection } from '/components/energy-section.js';
import { MoneySection } from '/components/money-section.js';
import { PowerSection } from '/components/power-section.js';
import { PriceSection } from '/components/price-section.js';
import { QuickSection } from '/components/quick-section.js';
import { SourceSection } from '/components/source-section.js';
import { WeatherSection } from '/components/weather-section.js';

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
    QuickSection.updateSource(json.power);
    PowerSection.update(json);
    EnergySection.update(json.energy);
    SourceSection.update(json.energy);
    MoneySection.update(json.energy);
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

PriceSection.update();

await Promise.allSettled([
  fetchApiData('/history', async (/** @type {NowResponse[]} */ json) => {
    charts = new DataCharts(json);
    await update(json.at(-1));
  }, () => {
    DataCharts.error();
    SourceSection.error();
  }),
  fetchApiData('/devices', (/** @type {DevicesResponse} */json) => {
    setBatteryInfo(json.batteries[0]);
  }),
  fetchWeatherData((/** @type {WeatherResponse} */json) => {
    const location = json.nearest_area?.at(0) ?? null;
    const currentCondition = json.current_condition?.at(0) ?? null;
    const todaysWeather = json.weather?.at(0) ?? null;
    if (location !== null) {
      if (currentCondition !== null) QuickSection.updateWeather(
        location,
        currentCondition
      );
      if (todaysWeather !== null) WeatherSection.update(
        document.getElementById('weather'),
        location,
        todaysWeather
      );
    }
  }, () => {
    WeatherSection.error(document.getElementById('weather'));
  })
]);

setInterval(update, LIVE_UPDATE_DELAY);
