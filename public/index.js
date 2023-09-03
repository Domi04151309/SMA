import { DataCharts, setBatteryInfo } from '/components/data-charts.js';
import { ConnectionBanner } from '/components/connection-banner.js';
import { DevicesSection } from '/components/devices-section.js';
import { EnergySection } from '/components/energy-section.js';
import { MoneySection } from '/components/money-section.js';
import { PowerSection } from '/components/power-section.js';
import { PriceSection } from '/components/price-section.js';
import { QuickSection } from '/components/quick-section.js';
import { WeatherSection } from '/components/weather-section.js';

const API_URL = '/api';
const LIVE_UPDATE_DELAY = 10_000;
const CHART_UPDATE_DELAY = 300_000;

/** @type {DataCharts|null} */
let charts = null;
let updateCounter = 0;

/**
 * @param {string} apiEndpoint
 * @param {(json: any) => Promise<void>|void} onSuccess
 * @param {(() => Promise<void>|void)|null} onError
 * @returns {Promise<void>}
 */
async function fetchApiData(apiEndpoint, onSuccess, onError = null) {
  try {
    const response = await fetch(API_URL + apiEndpoint);
    if (
      onSuccess.constructor.name === 'AsyncFunction'
    ) await onSuccess(await response.json());
    else onSuccess(await response.json());
  } catch {
    console.warn('Failed loading', API_URL + apiEndpoint);
    if (onError === null) return;
    if (onError.constructor.name === 'AsyncFunction') await onError();
    else onError();
  }
}

/**
 * @param {NowResponse|null} data
 * @returns {Promise<void>}
 */
async function update(data = null) {
  updateCounter += LIVE_UPDATE_DELAY;
  await fetchApiData('/now', json => {
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
  }, () => ConnectionBanner.disconnected());
}

PriceSection.update();

await Promise.allSettled([
  fetchApiData('/history', async json => {
    charts = new DataCharts(json);
    await update(json.at(-1));
  }, () => DataCharts.error()),
  fetchApiData('/devices', json => {
    setBatteryInfo(json.batteries[0]);
    DevicesSection.update(json);
  }),
  fetchApiData('/weather', json => {
    QuickSection.updateWeather(json);
    // eslint-disable-next-line no-new
    new WeatherSection(json);
  }, () => WeatherSection.error())
]);

setInterval(update, LIVE_UPDATE_DELAY);

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
    window.location.reload();
    refreshing = true;
  });
}
