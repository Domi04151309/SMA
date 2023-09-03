import { DataCharts } from '/components/data-charts.js';
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
/** @type {DevicesResponse|null} */
let devices = null;
/** @type {number|null} */
let interval = null;
let updateCounter = 0;

/**
 * @returns {Promise<NowResponse|null>}
 */
async function fetchLiveData() {
  try {
    const response = await fetch(API_URL + '/now');
    return await response.json();
  } catch {
    if (interval !== null) clearInterval(interval);
    console.warn('The backend is currently unreachable');
    return null;
  }
}

/**
 * @param {NowResponse|null} data
 * @returns {Promise<void>}
 */
async function update(data = null) {
  updateCounter += LIVE_UPDATE_DELAY;
  const json = data ?? await fetchLiveData();
  if (json === null) return;
  QuickSection.updateSource(json);
  PowerSection.update(json);
  EnergySection.update(json);
  MoneySection.update(json);
  if (data === null && charts !== null && updateCounter >= CHART_UPDATE_DELAY) {
    updateCounter = 0;
    charts.update(json);
  }
}

try {
  const response = await fetch(API_URL + '/history');
  const json = await response.json();
  charts = new DataCharts(json);
  await update(json.at(-1));
} catch {
  console.warn('Failed loading history');
  DataCharts.error();
}

try {
  const response = await fetch(API_URL + '/devices');
  devices = await response.json();
  if (devices === null) throw new Error('Invalid state');
  if (charts !== null) charts.setBatteryInfo(devices.batteries[0]);
  DevicesSection.update(devices);
} catch {
  console.warn('Failed loading devices');
}

try {
  const response = await fetch(API_URL + '/weather');
  const json = await response.json();
  QuickSection.updateWeather(json);
  // eslint-disable-next-line no-new
  new WeatherSection(json);
} catch {
  console.warn('Failed loading weather');
  WeatherSection.error();
}

PriceSection.update();

// @ts-expect-error
interval = setInterval(update, LIVE_UPDATE_DELAY);
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
