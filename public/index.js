import { Devices } from '/components/devices.js';
import { EnergySection } from '/components/energy-section.js';
import { HistoryCharts } from '/components/history-charts.js';
import { PowerSection } from '/components/power-section.js';
import { WeatherSection } from '/components/weather-section.js';

const API_URL = '/api';

let charts = null;
let devices = null;
let interval = null;

async function fetchLiveData() {
  try {
    const response = await fetch(API_URL + '/now');
    return await response.json();
  } catch (error) {
    clearInterval(interval);
    throw new Error(
      'The backend is currently unreachable!',
      { cause: error }
    );
  }
}

async function update(data = null) {
  const json = data ?? await fetchLiveData();
  PowerSection.update(json);
  EnergySection.update(json);
  if (data === null) charts.update(json);
}

let json, response;

try {
  response = await fetch(API_URL + '/devices');
  devices = await response.json();
  Devices.update(devices);
} catch {
  console.error('Failed loading devices');
}

try {
  response = await fetch(API_URL + '/history');
  json = await response.json();
  charts = new HistoryCharts(json, devices);
  await update(json.at(-1));
} catch {
  console.error('Failed loading history');
  HistoryCharts.error();
}

try {
  response = await fetch(API_URL + '/weather');
  json = await response.json();
  // eslint-disable-next-line no-new
  new WeatherSection(json);
} catch {
  console.error('Failed loading weather');
  WeatherSection.error();
}

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
