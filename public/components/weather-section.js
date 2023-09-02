import { Chart, commonChartOptions, error } from '/components/charts.js';

const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const sunHours = document.getElementById('sun-hours');
const uvIndex = document.getElementById('uv-index');

export class WeatherSection {
  constructor(/** @type {WeatherResponse} */ json) {
    if (
      sunrise === null ||
      sunset === null ||
      sunHours === null ||
      uvIndex === null
    ) throw new Error('Invalid layout');

    this.weatherChart = new Chart('#weather-chart', {
      ...commonChartOptions,
      colors: ['#FFD600', '#304FFE', '#2979FF', '#40C4FF', '#84FFFF'],
      data: {
        datasets: [
          {
            name: 'Sonne',
            values: json?.hourly?.map(hour => hour.chanceofsunshine) ?? []
          },
          {
            name: 'Regen',
            values: json?.hourly?.map(hour => hour.chanceofrain) ?? []
          },
          {
            name: 'Nebel',
            values: json?.hourly?.map(hour => hour.chanceoffog) ?? []
          },
          {
            name: 'Wolken',
            values: json?.hourly?.map(hour => hour.chanceofovercast) ?? []
          },
          {
            name: 'Schnee',
            values: json?.hourly?.map(hour => hour.chanceofsnow) ?? []
          }
        ],
        labels: json?.hourly?.map(
          hour => parseInt(hour.time, 10) / 100 + ' Uhr'
        ) ?? [],
        yMarkers: [
          { label: '', value: 0 },
          { label: '', value: 100 }
        ]
      },
      lineOptions: {
        hideDots: 1,
        regionFill: 1,
        spline: 1
      },
      title: 'Wetterverlauf',
      tooltipOptions: {
        formatTooltipX: (/** @type {string|null} */ value) => {
          if (value === null) return '';
          const time = (parseInt(value, 10) * 100).toString();
          return value + ' | ' + json?.hourly?.find(
            item => item.time === time
          )?.lang_de[0]?.value;
        },
        formatTooltipY: (/** @type {number|null} */ value) => value + ' %'
      },
      type: 'line'
    });

    const sunHourValue = parseFloat(json?.sunHour ?? '');
    sunrise.textContent = json?.astronomy[0]?.sunrise ?? '?';
    sunset.textContent = json?.astronomy[0]?.sunset ?? '?';
    sunHours.textContent = isNaN(sunHourValue)
      ? '?'
      : sunHourValue.toLocaleString('de');
    uvIndex.textContent = json?.uvIndex ?? '?';
  }

  static error() {
    error('#weather-chart', {
      title: 'Wetterverlauf'
    });
  }
}
