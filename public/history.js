import { EconomySection } from '/components/economy-section.js';
import { EconomySettings } from '/components/economy-settings.js';
import { EnergySection } from '/components/energy-section.js';
import { EnergySectionSmall } from '/components/energy-section-small.js';
import { HistoryCharts } from '/components/history-charts.js';
import { SourceSection } from '/components/source-section.js';
import { fetchApiData } from '/utils/api.js';

const titleView = document.getElementById('now') ?? new HTMLElement();
const loadingView = document.getElementById(
  'loading'
) ?? new HTMLElement();
const historyView = document.getElementById(
  'history-chart'
) ?? new HTMLElement();
const batteryView = document.getElementById(
  'battery-chart'
) ?? new HTMLElement();
const fullSection = document.getElementById('full') ?? new HTMLElement();
/** @type {{[key: string]: Intl.DateTimeFormatOptions }} */
const options = {
  day: { day: 'numeric', month: 'long', year: 'numeric' },
  month: { month: 'long', year: 'numeric' },
  year: { year: 'numeric' }
};
let category = 'day';
let date = new Date();

/**
 * @param {NowResponse[]} json
 * @returns {Energy}
 */
function getEnergyDifference(json) {
  return Object.keys(json[0].energy).reduce(
    (result, key) => {
      // @ts-expect-error
      result[key] = (json.at(-1)?.energy[key] ?? 0) - json[0].energy[key];
      return result;
    },
    json[0].energy
  );
}

/**
 * @returns {void}
 */
function onError() {
  loadingView.style.display = 'none';
  HistoryCharts.error();
}

/**
 * @returns {Promise<void>}
 */
async function updateViews() {
  titleView.textContent = date.toLocaleDateString('de', options[category]);
  historyView.textContent = '';
  batteryView.textContent = '';
  EnergySectionSmall.hide();
  fullSection.style.display = 'none';
  loadingView.style.display = '';
  const endDate = new Date(date);
  switch (category) {
  case 'day':
    endDate.setDate(endDate.getDate() + 1);
    break;
  case 'month':
    endDate.setMonth(endDate.getMonth() + 1);
    break;
  case 'year':
    endDate.setFullYear(endDate.getFullYear() + 1);
    break;
  default:
    break;
  }
  const query = '?start=' + date.getTime() + '&end=' + endDate.getTime();
  if (category === 'month' || category === 'year') await fetchApiData(
    '/daily' + query,
    (/** @type {NowResponse[]} */ json) => {
      loadingView.style.display = 'none';
      HistoryCharts.updateDaily(json);
      if (json.length === 0) return;
      fullSection.style.display = '';
      const difference = getEnergyDifference(json);
      EnergySection.update(difference);
      // eslint-disable-next-line no-new
      new SourceSection(difference);
      EconomySection.update(difference);
    },
    () => {
      onError();
    }
  );
  else if (category === 'day') await fetchApiData(
    '/exact' + query,
    (/** @type {NowResponse[]} */ json) => {
      loadingView.style.display = 'none';
      HistoryCharts.updateExact(json);
      if (json.length === 0) return;
      EnergySectionSmall.update(getEnergyDifference(json));
    },
    () => {
      onError();
    }
  );
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
async function handleCategoryChange(id) {
  for (const buttonId of ['day', 'month', 'year']) {
    const button = document.getElementById(buttonId);
    if (button !== null) button.classList.toggle('outlined', buttonId !== id);
  }
  category = id;
  date = new Date();
  date.setHours(0, 0, 0, 0);
  if (category === 'month' || category === 'year') date.setDate(1);
  if (category === 'year') date.setMonth(0);
  await updateViews();
}

await handleCategoryChange('day');
EconomySettings.update();
for (
  const id of ['day', 'month', 'year']
) document.getElementById(id)?.addEventListener(
  'click',
  async event => {
    await handleCategoryChange(/** @type {Element} */ (event.target).id);
  }
);

document.getElementById('previous')?.addEventListener('click', async () => {
  switch (category) {
  case 'day':
    date.setDate(date.getDate() - 1);
    break;
  case 'month':
    date.setMonth(date.getMonth() - 1);
    break;
  case 'year':
    date.setFullYear(date.getFullYear() - 1);
    break;
  default:
    break;
  }
  await updateViews();
});

document.getElementById('next')?.addEventListener('click', async () => {
  switch (category) {
  case 'day':
    date.setDate(date.getDate() + 1);
    break;
  case 'month':
    date.setMonth(date.getMonth() + 1);
    break;
  case 'year':
    date.setFullYear(date.getFullYear() + 1);
    break;
  default:
    break;
  }
  await updateViews();
});
