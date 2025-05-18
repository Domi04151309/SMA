import { DataCharts, setBatteryInfo } from '/components/data-charts.js';
import {
  QuickSection,
  setBatteryCapacity,
  setBatteryPercentage
} from '/components/quick-section.js';
import { fetchApiData, fetchWeatherData } from '/utils/api.js';
import { ConnectionBanner } from '/components/connection-banner.js';
import { EcologySection } from '/components/ecology-section.js';
import { EcologySettings } from '/components/ecology-settings.js';
import { EconomySection } from '/components/economy-section.js';
import { EconomySettings } from '/components/economy-settings.js';
import { EnergySection } from '/components/energy-section.js';
import { PowerSection } from '/components/power-section.js';
import { SourceSection } from '/components/source-section.js';
import { WeatherSection } from '/components/weather-section.js';
import { getBatteryPrediction } from '/utils/statistics.js';
const LIVE_UPDATE_DELAY = 10_000;
const CHART_UPDATE_DELAY = 300_000;

/** @type {DataCharts|null} */
let charts = null;
/** @type {SourceSection|null} */
let sources = null;
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
    if (sources === null) sources = SourceSection.create(json.energy);
    else sources.update(json.energy);
    EconomySection.update(json.energy);
    EcologySection.update(json.energy);
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

EcologySettings.update();
EconomySettings.update();

const batteryPrediction = getBatteryPrediction();
await Promise.allSettled([
  fetchApiData('/history', async (/** @type {NowResponse[]} */ json) => {
    charts = new DataCharts(json);
    const latest = json.at(-1);
    setBatteryPercentage((latest?.batteryPercentage ?? 0) / 100);
    await update(latest);
  }, () => {
    DataCharts.error();
    SourceSection.error();
    QuickSection.sourceError();
  }),
  fetchApiData('/devices', (/** @type {DevicesResponse} */json) => {
    const [battery] = json.batteries;
    setBatteryInfo(battery);
    setBatteryCapacity(
      battery.capacity * battery.capacityOfOriginalCapacity / 100
    );
  }),
  fetchWeatherData((/** @type {WeatherResponse} */json) => {
    const location = json.nearest_area?.at(0) ?? null;
    const currentCondition = json.current_condition?.at(0) ?? null;
    const todaysWeather = json.weather?.at(0) ?? null;
    if (
      location === null ||
      currentCondition === null ||
      todaysWeather === null
    ) throw new Error('Empty');
    QuickSection.updateWeather(location, currentCondition);
    WeatherSection.update(
      document.getElementById('weather'),
      location,
      todaysWeather
    );
  }, () => {
    QuickSection.weatherError();
    WeatherSection.error(document.getElementById('weather'));
  })
]);
QuickSection.updateBattery(await batteryPrediction);

setInterval(update, LIVE_UPDATE_DELAY);
