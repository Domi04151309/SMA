import { Chart, commonChartOptions, error } from '/components/charts.js';

export const SourceSection = {
  error() {
    error('#source-chart', {
      title: 'Quelle genutzter Energie'
    });
  },
  update(/** @type {Energy|undefined} */ json) {
    // eslint-disable-next-line no-new
    new Chart('#source-chart', {
      ...commonChartOptions,
      data: {
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
      },
      title: 'Quelle genutzter Energie',
      tooltipOptions: {
        formatTooltipY: (
          /** @type {number|null} */ value
        ) => value?.toLocaleString('de') + ' Wh'
      },
      type: 'pie'
    });
  }
};
