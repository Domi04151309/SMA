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
  } catch (exception) {
    clearInterval(interval);
    throw new Error(
      'The backend is currently unreachable!',
      { cause: exception }
    );
  }
}

async function update(data = null) {
  const json = data ?? await fetchLiveData();
  PowerSection.update(json);
  EnergySection.update(json);
  if (data === null) charts.update(json);
}

async function initialize() {
  const response = await fetch(API_URL + '/history');
  const json = await response.json();
  charts = new Charts(json);
  await update(json.at(-1));
  interval = setInterval(update, 10000);
}

initialize();
