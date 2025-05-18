import { Chart, commonChartOptions, error } from '/utils/charts.js';

/**
 * @param {Energy|undefined} json
 * @returns {unknown}
 */
function getData(json) {
  return {
    datasets: [
      {
        values: [
          (json?.fromRoof ?? 0) - (json?.toGrid ?? 0) -
            (json?.toBattery ?? 0),
          json?.fromBattery ?? 0,
          json?.fromGrid ?? 0
        ]
      }
    ],
    labels: ['Vom Dach', 'Aus der Batterie', 'Vom Netz']
  };
}

export class SourceSection {
  constructor(/** @type {Energy|undefined} */ json) {
    this.chart = new Chart('#source-chart', {
      ...commonChartOptions,
      data: getData(json),
      title: 'Quelle genutzter Energie',
      tooltipOptions: {
        formatTooltipY: (
          /** @type {number|null} */ value
        ) => `${value?.toLocaleString('de') ?? '?'} Wh`
      },
      type: 'pie'
    });
  }

  update(/** @type {Energy|undefined} */ json) {
    this.chart.update(getData(json));
  }

  static create(/** @type {Energy|undefined} */ json) {
    return new SourceSection(json);
  }

  static error() {
    error('#source-chart', {
      title: 'Quelle genutzter Energie'
    });
  }
}
