import { HistoryCharts } from '/components/history-charts.js';
import { fetchApiData } from '/utils/api.js';

const nowDisplay = document.getElementById('now');
const loadingIndicator = document.getElementById('loading');
const historyChart = document.getElementById('history-chart');
const batteryChart = document.getElementById('battery-chart');
/** @type {{[key: string]: Intl.DateTimeFormatOptions }} */
const options = {
  day: { day: 'numeric', month: 'long', year: 'numeric' },
  month: { month: 'long', year: 'numeric' },
  year: { year: 'numeric' }
};
let category = 'day';
let date = new Date();

if (
  nowDisplay === null ||
  loadingIndicator === null ||
  historyChart === null ||
  batteryChart === null
) throw new Error('Invalid layout');

/**
 * @param {HTMLElement} loadingView
 * @returns {void}
 */
function onError(loadingView) {
  loadingView.style.display = 'none';
  HistoryCharts.error();
}

/**
 * @param {Node} titleView
 * @param {HTMLElement} loadingView
 * @param {Node} historyView
 * @param {Node} batteryView
 * @returns {Promise<void>}
 */
async function updateViews(
  titleView,
  loadingView,
  historyView,
  batteryView
) {
  titleView.textContent = date.toLocaleDateString('de', options[category]);
  loadingView.style.display = 'block';
  historyView.textContent = '';
  batteryView.textContent = '';
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
    (/** @type {DailyResponse[]} */ json) => {
      loadingView.style.display = 'none';
      HistoryCharts.updateDaily(json);
    },
    () => {
      onError(loadingView);
    }
  );
  else if (category === 'day') await fetchApiData(
    '/exact' + query,
    (/** @type {NowResponse[]} */ json) => {
      loadingView.style.display = 'none';
      HistoryCharts.updateExact(json);
    },
    () => {
      onError(loadingView);
    }
  );
}

/**
 * @param {string} id
 * @param {Node} titleView
 * @param {HTMLElement} loadingView
 * @param {Node} historyView
 * @param {Node} batteryView
 * @returns {Promise<void>}
 */
async function handleCategoryChange(
  id,
  titleView,
  loadingView,
  historyView,
  batteryView
) {
  category = id;
  date = new Date();
  date.setHours(0, 0, 0, 0);
  if (category === 'month' || category === 'year') date.setDate(1);
  if (category === 'year') date.setMonth(0);
  await updateViews(titleView, loadingView, historyView, batteryView);
}

await handleCategoryChange(
  'day',
  nowDisplay,
  loadingIndicator,
  historyChart,
  batteryChart
);
for (
  const id of ['day', 'month', 'year']
) document.getElementById(id)?.addEventListener(
  'click',
  async event => {
    await handleCategoryChange(
      /** @type {Element} */ (event.target).id,
      nowDisplay,
      loadingIndicator,
      historyChart,
      batteryChart
    );
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
  await updateViews(nowDisplay, loadingIndicator, historyChart, batteryChart);
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
  await updateViews(nowDisplay, loadingIndicator, historyChart, batteryChart);
});
