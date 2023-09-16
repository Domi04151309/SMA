import { Chart, commonChartOptions, error } from '/utils/charts.js';

const FIRST_CHART_SELECTOR = '#first-chart';
const SECOND_CHART_SELECTOR = '#second-chart';

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
 * @param {number|null} value
 * @returns {string}
 */
function formatTooltipY(value) {
  return value?.toLocaleString('de') + ' Wh';
}

export const HistoryCharts = {
  error() {
    error(FIRST_CHART_SELECTOR, {
      height: 480,
      title: ''
    });
    error(SECOND_CHART_SELECTOR, {
      title: ''
    });
  },
  updateDaily(/** @type {DailyResponse[]} */ json) {
    const barOptions = {
      spaceRatio: 0.1,
      stacked: 1
    };
    const datasets = {
      labels: json.map(
        item => new Date(item.timestamp).toLocaleDateString('de')
      ).slice(0, -1),
      yMarkers: [{ label: '', value: 0 }]
    };
    const fromRoof = Object.fromEntries(json.map(
      (item, index) => index < json.length - 1
        ? [
          new Date(item.timestamp).toLocaleDateString('de'),
          Math.max(
            0,
            json[index + 1].energy.fromRoof - item.energy.fromRoof
          )
        ]
        : [
          new Date(item.timestamp).toLocaleDateString('de'),
          0
        ]
    ).slice(0, -1));
    const fromRoofUsed = json.map(
      (item, index) => index < json.length - 1
        ? Math.max(
          0,
          json[index + 1].energy.fromRoof - item.energy.fromRoof -
          (json[index + 1].energy.toGrid - item.energy.toGrid) -
          (json[index + 1].energy.toBattery - item.energy.toBattery)
        )
        : 0
    ).slice(0, -1);
    const energyUsed = Object.fromEntries(json.map(
      (item, index) => index < json.length - 1
        ? [
          new Date(item.timestamp).toLocaleDateString('de'),
          Math.max(
            0,
            json[index + 1].energy.fromRoof - item.energy.fromRoof -
            (json[index + 1].energy.toGrid - item.energy.toGrid) -
            (json[index + 1].energy.toBattery - item.energy.toBattery) +
            json[index + 1].energy.fromBattery - item.energy.fromBattery +
            json[index + 1].energy.fromGrid - item.energy.fromGrid
          )
        ]
        : [
          new Date(item.timestamp).toLocaleDateString('de'),
          0
        ]
    ).slice(0, -1));
    // eslint-disable-next-line no-new
    new Chart(FIRST_CHART_SELECTOR, {
      ...commonChartOptions,
      barOptions,
      data: {
        datasets: [
          {
            chartType: 'bar',
            name: 'Direktverbrauch',
            values: fromRoofUsed
          },
          {
            chartType: 'bar',
            name: 'Batterieladung',
            values: json.map(
              (item, index) => index < json.length - 1
                ? Math.max(
                  0,
                  json[index + 1].energy.toBattery - item.energy.toBattery
                )
                : 0
            ).slice(0, -1)
          },
          {
            chartType: 'bar',
            name: 'Netzeinspeisung',
            values: json.map(
              (item, index) => index < json.length - 1
                ? Math.max(
                  0,
                  json[index + 1].energy.toGrid - item.energy.toGrid
                )
                : 0
            ).slice(0, -1)
          }
        ],
        ...datasets
      },
      height: 480,
      title: 'Erzeugung',
      tooltipOptions: {
        formatTooltipX: (
          /** @type {string|null} */ value
        ) => value + ' | ' + (
          value !== null && value in fromRoof ? fromRoof[value] : 0
        ).toLocaleString('de') + ' Wh',
        formatTooltipY
      }
    });
    // eslint-disable-next-line no-new
    new Chart(SECOND_CHART_SELECTOR, {
      ...commonChartOptions,
      barOptions,
      data: {
        datasets: [
          {
            chartType: 'bar',
            name: 'Direktverbrauch',
            values: fromRoofUsed
          },
          {
            chartType: 'bar',
            name: 'Batterieentladung',
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
            name: 'Netzbezug',
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
        ...datasets
      },
      title: 'Verbrauch',
      tooltipOptions: {
        formatTooltipX: (
          /** @type {string|null} */ value
        ) => value + ' | ' + (
          value !== null && value in energyUsed ? energyUsed[value] : 0
        ).toLocaleString('de') + ' Wh',
        formatTooltipY
      }
    });
  },
  updateExact(/** @type {NowResponse[]} */ json) {
    // eslint-disable-next-line no-new
    new Chart(FIRST_CHART_SELECTOR, {
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
    new Chart(SECOND_CHART_SELECTOR, {
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
