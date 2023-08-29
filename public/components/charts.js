import {
  Chart
} from '../frappe-charts.min.esm.js';

function toTimeString(date) {
  return date.toLocaleTimeString(
    'de',
    {
      hour: 'numeric',
      minute: 'numeric'
    }
  ) + ' Uhr';
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

export class Charts {
  constructor(json, devices) {
    const commonChartOptions = {
      axisOptions: {
        xAxisMode: 'tick',
        xIsSeries: 1
      },
      barOptions: {
        spaceRatio: 0.1,
        stacked: 1
      },
      colors: ['#00E676', '#00B0FF', '#2979FF', '#651FFF'],
      height: 240,
      lineOptions: { hideDots: 1 },
      type: 'axis-mixed'
    };
    this.sourceChart = new Chart('#source-chart', {
      ...commonChartOptions,
      data: {
        datasets: [
          {
            values: [
              (json.at(-1).energy.fromRoof ?? 0) -
                (json.at(-1).energy.toGrid ?? 0) -
                (json.at(-1).energy.toBattery ?? 0),
              json.at(-1).energy.fromBattery ?? 0,
              json.at(-1).energy.fromGrid ?? 0
            ]
          }
        ],
        labels: ['Vom Dach', 'Aus der Batterie', 'Vom Netz']
      },
      title: 'Quelle genutzter Energie',
      tooltipOptions: {
        formatTooltipY: value => value?.toLocaleString('de') + ' Wh'
      },
      type: 'pie'
    });
    this.historyChart = new Chart('#history-chart', {
      ...commonChartOptions,
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
        formatTooltipY: value => value?.toLocaleString('de') + ' W'
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
        formatTooltipY: value => value + ' % | ' + (
          (devices.batteries[0]?.capacity ?? 0) *
          (devices.batteries[0]?.capacityOfOriginalCapacity ?? 0) / 100 *
          value / 100
        ).toLocaleString('de') + ' Wh'
      }
    });
  }

  update(json) {
    this.historyChart.addDataPoint(
      toTimeString(new Date(json.timestamp)),
      [
        json.power.fromRoof ?? 0,
        json.power.fromBattery ?? 0,
        json.power.fromGrid ?? 0,
        json.power.currentUsage ?? 0
      ]
    );
    this.batteryChart.addDataPoint(
      toTimeString(new Date(json.timestamp)),
      [json.batteryPercentage ?? 0]
    );
  }
}
