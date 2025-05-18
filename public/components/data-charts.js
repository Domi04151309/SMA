import { Chart, commonChartOptions, error } from '/utils/charts.js';

/** @type {Battery|null} */
let battery = null;

/**
 * @param {Date} date
 * @returns {string}
 */
function toTimeString(date) {
  return `${date.toLocaleTimeString(
    'de',
    {
      hour: 'numeric',
      minute: 'numeric'
    }
  )} Uhr`;
}

/**
 * @param {Battery|null} batteryInfo
 * @returns {void}
 */
export function setBatteryInfo(batteryInfo) {
  battery = batteryInfo;
}

export class DataCharts {
  constructor(/** @type {NowResponse[]} */ json) {
    this.historyChart = new Chart('#history-chart', {
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
          },
          {
            chartType: 'line',
            name: 'Haus',
            values: json.map(item => item.power.currentUsage)
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
        ) => `${value?.toLocaleString('de') ?? '?'} W`
      }
    });
    this.batteryChart = new Chart('#battery-chart', {
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
        formatTooltipY: (
          /** @type {number|null} */ value
        ) => `${value?.toString() ?? '?'} % | ${(
          (battery?.capacity ?? 0) *
          (battery?.capacityOfOriginalCapacity ?? 0) / 100 *
          (value ?? 0) / 100
        ).toLocaleString('de')} Wh`
      }
    });
    this.gridChart = new Chart('#grid-chart', {
      ...commonChartOptions,
      colors: ['#2979FF'],
      data: {
        datasets: [
          {
            chartType: 'line',
            name: 'Netz',
            values: json.map(item => item.power.toGrid)
          }
        ],
        labels: json.map(item => toTimeString(new Date(item.timestamp)))
      },
      title: 'Netzeinspeisung',
      tooltipOptions: {
        formatTooltipY: (
          /** @type {number|null} */ value
        ) => `${value?.toLocaleString('de') ?? '?'} W`
      }
    });
  }

  update(/** @type {NowResponse} */ json) {
    this.historyChart.addDataPoint(
      toTimeString(new Date(json.timestamp)),
      [
        json.power.fromRoof,
        json.power.fromBattery,
        json.power.fromGrid,
        json.power.currentUsage
      ]
    );
    this.batteryChart.addDataPoint(
      toTimeString(new Date(json.timestamp)),
      [json.batteryPercentage ?? 0]
    );
    this.gridChart.addDataPoint(
      toTimeString(new Date(json.timestamp)),
      [json.power.toGrid - json.power.fromGrid]
    );
  }

  static error() {
    error('#history-chart', {
      height: 480,
      title: 'Leistung'
    });
    error('#battery-chart', {
      title: 'Batterie'
    });
    error('#grid-chart', {
      title: 'Netzeinspeisung'
    });
  }
}
