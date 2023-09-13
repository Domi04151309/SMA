import { Chart, commonChartOptions, error } from '/components/charts.js';

const HISTORY_CHART_SELECTOR = '#history-chart';
const BATTERY_CHART_SELECTOR = '#battery-chart';

/**
 * @param {Date} date
 * @returns {string}
 */
function toTimeString(date) {
  return date.toLocaleTimeString(
    'de',
    {
      hour: 'numeric',
      minute: 'numeric'
    }
  ) + ' Uhr';
}

export const HistoryCharts = {
  error() {
    error(HISTORY_CHART_SELECTOR, {
      height: 480,
      title: 'Leistung'
    });
    error(BATTERY_CHART_SELECTOR, {
      title: 'Batterie'
    });
  },
  updateDaily(/** @type {DailyResponse[]} */ json) {
    // eslint-disable-next-line no-new
    new Chart(HISTORY_CHART_SELECTOR, {
      ...commonChartOptions,
      data: {
        datasets: [
          {
            chartType: 'bar',
            name: 'Dach',
            values: json.map(
              (item, index) => index < json.length - 1
                ? Math.max(
                  0,
                  json[index + 1].energy.fromRoof - item.energy.fromRoof
                )
                : 0
            ).slice(0, -1)
          },
          {
            chartType: 'bar',
            name: 'Batterie',
            values: json.map(
              (item, index) => index < json.length - 1
                ? Math.max(
                  0,
                  json[index + 1].energy.fromBattery - item.energy.fromBattery
                )
                : 0
            ).slice(0, -1)
          },
          {
            chartType: 'bar',
            name: 'Netz',
            values: json.map(
              (item, index) => index < json.length - 1
                ? Math.max(
                  0,
                  json[index + 1].energy.fromGrid - item.energy.fromGrid
                )
                : 0
            ).slice(0, -1)
          }
        ],
        labels: json.map(
          item => new Date(item.timestamp).toLocaleDateString('de')
        ),
        yMarkers: [{ label: '', value: 0 }]
      },
      height: 480,
      title: 'Energie',
      tooltipOptions: {
        formatTooltipY: (
          /** @type {number|null} */ value
        ) => value?.toLocaleString('de') + ' Wh'
      }
    });
    const batteryChart = document.querySelector(BATTERY_CHART_SELECTOR);
    if (batteryChart !== null) batteryChart.textContent = '';
  },
  updateExact(/** @type {NowResponse[]} */ json) {
    // eslint-disable-next-line no-new
    new Chart(HISTORY_CHART_SELECTOR, {
      ...commonChartOptions,
      barOptions: {
        spaceRatio: 0.1,
        stacked: 1
      },
      data: {
        datasets: [
          {
            chartType: 'bar',
            name: 'Dach',
            values: json.map(item => item.power.fromRoof)
          },
          {
            chartType: 'bar',
            name: 'Batterie',
            values: json.map(item => item.power.fromBattery)
          },
          {
            chartType: 'bar',
            name: 'Netz',
            values: json.map(item => item.power.fromGrid)
          }
        ],
        labels: json.map(item => toTimeString(new Date(item.timestamp))),
        yMarkers: [{ label: '', value: 0 }]
      },
      height: 480,
      title: 'Leistung',
      tooltipOptions: {
        formatTooltipY: (
          /** @type {number|null} */ value
        ) => value?.toLocaleString('de') + ' W'
      }
    });
    // eslint-disable-next-line no-new
    new Chart(BATTERY_CHART_SELECTOR, {
      ...commonChartOptions,
      colors: ['#00B0FF'],
      data: {
        datasets: [
          {
            chartType: 'line',
            name: 'Batterieladung',
            values: json.map(item => item.batteryPercentage ?? 0)
          }
        ],
        labels: json.map(item => toTimeString(new Date(item.timestamp))),
        yMarkers: [
          { label: 'Leer', value: 0 },
          { label: 'Voll', value: 100 }
        ]
      },
      title: 'Batterie',
      tooltipOptions: {
        formatTooltipY: (/** @type {number|null} */ value) => value + ' %'
      }
    });
  }
};
