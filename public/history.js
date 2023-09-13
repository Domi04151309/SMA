import { HistoryCharts } from '/components/history-charts.js';
import { fetchApiData } from '/utils/api.js';

const nowDisplay = document.getElementById('now');
/** @type {{[key: string]: Intl.DateTimeFormatOptions }} */
const options = {
  day: { day: 'numeric', month: 'long', year: 'numeric' },
  month: { month: 'long', year: 'numeric' },
  year: { year: 'numeric' }
};
let category = 'day';
let date = new Date();

if (nowDisplay === null) throw new Error('Invalid layout');

/**
 * @param {Node} titleView
 * @returns {Promise<void>}
 */
async function updateViews(titleView) {
  titleView.textContent = date.toLocaleDateString('de', options[category]);
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
      HistoryCharts.updateDaily(json);
    },
    () => {
      HistoryCharts.error();
    }
  );
  else if (category === 'day') await fetchApiData(
    '/exact' + query,
    (/** @type {NowResponse[]} */ json) => {
      HistoryCharts.updateExact(json);
    },
    () => {
      HistoryCharts.error();
    }
  );
}

/**
 * @param {string} id
 * @param {Node} titleView
 * @returns {Promise<void>}
 */
async function handleCategoryChange(id, titleView) {
  category = id;
  date = new Date();
  date.setHours(0, 0, 0, 0);
  if (category === 'month' || category === 'year') date.setDate(1);
  if (category === 'year') date.setMonth(0);
  await updateViews(titleView);
}

await handleCategoryChange('day', nowDisplay);
for (
  const id of ['day', 'month', 'year']
) document.getElementById(id)?.addEventListener(
  'click',
  async event => {
    await handleCategoryChange(
      /** @type {Element} */ (event.target).id, nowDisplay
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
  await updateViews(nowDisplay);
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
  await updateViews(nowDisplay);
});
