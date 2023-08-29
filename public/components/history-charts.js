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

export class HistoryCharts {
  constructor(
    /** @type {ApiNowResponse[]} */ json,
    /** @type {ApiDevicesResponse} */ devices
  ) {
    this.sourceChart = new Chart('#source-chart', {
      ...commonChartOptions,
      data: {
        datasets: [
          {
            values: [
              (json.at(-1)?.energy?.fromRoof ?? 0) -
                (json.at(-1)?.energy?.toGrid ?? 0) -
                (json.at(-1)?.energy?.toBattery ?? 0),
              json.at(-1)?.energy?.fromBattery ?? 0,
              json.at(-1)?.energy?.fromGrid ?? 0
            ]
          }
        ],
        labels: ['Vom Dach', 'Aus der Batterie', 'Vom Netz']
      },
      title: 'Quelle genutzter Energie',
      tooltipOptions: {
        formatTooltipY: (
          /** @type {number|null} */ value
        ) => value?.toLocaleString('de') + ' Wh'
      },
      type: 'pie'
    });
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
            values: json.map(item => item.power.fromRoof ?? 0)
          },
          {
            chartType: 'bar',
            name: 'Batterie',
            values: json.map(item => item.power.fromBattery ?? 0)
          },
          {
            chartType: 'bar',
            name: 'Netz',
            values: json.map(item => item.power.fromGrid ?? 0)
          },
          {
            chartType: 'line',
            name: 'Haus',
            values: json.map(item => item.power.currentUsage ?? 0)
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
    this.batteryChart = new Chart('#battery-chart', {
      ...commonChartOptions,
      data: {
        datasets: [
          {
            chartType: 'line',
            name: 'Batterie',
            values: json.map(item => item.batteryPercentage ?? 0)
          }
        ],
        labels: json.map(item => toTimeString(new Date(item.timestamp))),
        yMarkers: [
          { label: 'Leer', value: 0 },
          { label: 'Voll', value: 100 }
        ]
      },
      lineOptions: {
        hideDots: 1,
        regionFill: 1
      },
      title: 'Batterie',
      tooltipOptions: {
        formatTooltipY: (
          /** @type {number|null} */ value
        ) => value + ' % | ' + (
          (devices.batteries[0]?.capacity ?? 0) *
          (devices.batteries[0]?.capacityOfOriginalCapacity ?? 0) / 100 *
          (value ?? 0) / 100
        ).toLocaleString('de') + ' Wh'
      }
    });
  }

  update(/** @type {ApiNowResponse} */ json) {
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
  }

  static error() {
    error('#source-chart', {
      title: 'Quelle genutzter Energie'
    });
    error('#history-chart', {
      height: 480,
      title: 'Leistung'
    });
    error('#battery-chart', {
      title: 'Batterie'
    });
  }
}
