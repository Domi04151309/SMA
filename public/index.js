import { Charts } from './components/charts.js';
import { EnergySection } from './components/energy-section.js';
import { PowerSection } from './components/power-section.js';

const API_URL = '/api';

let charts = null;
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

const response = await fetch(API_URL + '/history');
const json = await response.json();
charts = new Charts(json);
await update(json.at(-1));
interval = setInterval(update, 10_000);
