import { DevicesSection } from '/components/devices-section.js';
import { EnergySection } from '/components/energy-section.js';
import { HistoryCharts } from '/components/history-charts.js';
import { MoneySection } from '/components/money-section.js';
import { PowerSection } from '/components/power-section.js';
import { PriceSection } from '/components/price-section.js';
import { QuickSection } from '/components/quick-section.js';
import { WeatherSection } from '/components/weather-section.js';

const API_URL = '/api';

/** @type {HistoryCharts|null} */
let charts = null;
/** @type {DevicesResponse|null} */
let devices = null;
/** @type {number|null} */
let interval = null;

/**
 * @returns {Promise<NowResponse>}
 */
async function fetchLiveData() {
  try {
    const response = await fetch(API_URL + '/now');
    return await response.json();
  } catch (error) {
    if (interval !== null) clearInterval(interval);
    throw new Error(
      'The backend is currently unreachable!',
      { cause: error }
    );
  }
}

/**
 * @param {NowResponse|null} data
 * @returns {Promise<void>}
 */
async function update(data = null) {
  const json = data ?? await fetchLiveData();
  QuickSection.updateSource(json);
  PowerSection.update(json);
  EnergySection.update(json);
  MoneySection.update(json);
  if (data === null && charts !== null) charts.update(json);
}

let json, response;

try {
  response = await fetch(API_URL + '/devices');
  devices = await response.json();
  if (devices !== null) DevicesSection.update(devices);
} catch {
  console.error('Failed loading devices');
}

try {
  response = await fetch(API_URL + '/history');
  json = await response.json();
  if (devices !== null) charts = new HistoryCharts(json, devices);
  await update(json.at(-1));
} catch {
  console.error('Failed loading history');
  HistoryCharts.error();
}

try {
  response = await fetch(API_URL + '/weather');
  json = await response.json();
  QuickSection.updateWeather(json);
  // eslint-disable-next-line no-new
  new WeatherSection(json);
} catch {
  console.error('Failed loading weather');
  WeatherSection.error();
}

PriceSection.update();

// @ts-expect-error
interval = setInterval(update, 10_000);
devices = null;

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
