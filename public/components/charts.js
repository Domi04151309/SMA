import { Chart } from '/frappe-charts.min.esm.js';

export const commonChartOptions = {
  axisOptions: {
    xAxisMode: 'tick',
    xIsSeries: 1
  },
  colors: ['#00E676', '#00B0FF', '#2979FF', '#651FFF'],
  height: 240,
  lineOptions: { hideDots: 1 },
  type: 'axis-mixed'
};

export function error(selector, options) {
  const errorOptions = {
    colors: ['#D50000'],
    data: {
      datasets: [
        {
          values: [1]
        }
      ],
      labels: ['Fehler']
    },
    type: 'percentage'
  };
  // eslint-disable-next-line no-new
  new Chart(selector, {
    ...commonChartOptions,
    ...errorOptions,
    ...options
  });
}

addEventListener('beforeprint', () => {
  for (
    const chart of document.querySelectorAll('.chart-container svg')
  ) {
    chart.setAttribute(
      'viewBox',
      '0 0 ' + chart.width.baseVal.value + ' ' + chart.height.baseVal.value
    );
    chart.style.width = '100%';
  }
});
addEventListener('afterprint', () => {
  for (
    const chart of document.querySelectorAll('.chart-container svg')
  ) {
    chart.removeAttribute('viewBox');
    chart.style.width = '';
  }
});

export { Chart } from '/frappe-charts.min.esm.js';
