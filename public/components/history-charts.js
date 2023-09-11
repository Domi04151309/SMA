import { Chart, commonChartOptions, error } from '/components/charts.js';

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

/**
 * @param {NowResponse[]} json
 * @returns {unknown}
 */
function getHistoryChartData(json) {
  return {
    datasets: [
      {
        chartType: 'bar',
        name: 'Dach',
        values: json.map(item => item.power.fromRoof)
      },
      {
        chartType: 'bar',
        name: 'Netz',
        values: json.map(item => item.power.fromGrid)
      }
    ],
    labels: json.map(item => toTimeString(new Date(item.timestamp))),
    yMarkers: [{ label: '', value: 0 }]
  };
}

/**
 * @param {NowResponse[]} json
 * @returns {unknown}
 */
function getBatteryChartData(json) {
  return {
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
  };
}

/**
 * @returns {unknown}
 */
function getErrorData() {
  return {
    datasets: [
      {
        chartType: 'bar',
        values: [1]
      }
    ],
    labels: ['Fehler']
  };
}

export class HistoryCharts {
  constructor(/** @type {NowResponse[]} */ json) {
    this.historyChart = new Chart('#history-chart', {
      ...commonChartOptions,
      barOptions: {
        spaceRatio: 0.1,
        stacked: 1
      },
      data: getHistoryChartData(json),
      height: 480,
      title: 'Leistung',
      tooltipOptions: {
        formatTooltipY: (
          /** @type {number|null} */ value
        ) => value?.toLocaleString('de') + ' W'
      }
    });
    this.batteryChart = new Chart('#battery-chart', {
      ...commonChartOptions,
      colors: ['#00B0FF'],
      data: getBatteryChartData(json),
      title: 'Batterie',
      tooltipOptions: {
        formatTooltipY: (/** @type {number|null} */ value) => value + ' %'
      }
    });
  }

  update(/** @type {NowResponse[]} */ json) {
    this.historyChart.update(getHistoryChartData(json));
    this.batteryChart.update(getBatteryChartData(json));
  }

  error() {
    this.historyChart.update(getErrorData());
    this.batteryChart.update(getErrorData());
  }

  static error() {
    error('#history-chart', {
      height: 480,
      title: 'Leistung'
    });
    error('#battery-chart', {
      title: 'Batterie'
    });
  }
}
