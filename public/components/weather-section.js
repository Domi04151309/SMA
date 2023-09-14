/* global SunCalc */
import '/suncalc.js';
import { Chart, commonChartOptions, error } from '/utils/charts.js';
import { Settings } from '../utils/settings.js';

const INVALID_LAYOUT = 'Invalid layout';

export const WeatherSection = {
  error(/** @type {DocumentFragment|Element|null} */ node) {
    if (node === null) throw new Error(INVALID_LAYOUT);
    error(node.querySelector('.weather-chart'), {
      title: 'Wetterverlauf'
    });
  },
  update(
    /** @type {DocumentFragment|Element|null} */ node,
    /** @type {WeatherResponse} */ json
  ) {
    if (node === null) throw new Error(INVALID_LAYOUT);
    const sunrise = node.querySelector('.weather-sunrise');
    const sunset = node.querySelector('.weather-sunset');
    const sunHours = node.querySelector('.weather-sun-hours');
    const uvIndex = node.querySelector('.weather-uv-index');
    if (
      sunrise === null ||
      sunset === null ||
      sunHours === null ||
      uvIndex === null
    ) throw new Error(INVALID_LAYOUT);
    const location = Settings.getItem('location')
      ?.split(',', 2)
      .map(parseFloat) ?? [];
    const date = new Date(json.date);
    let positions = json.hourly.map(
      hour => {
        date.setHours(parseInt(hour.time, 10) / 100);
        // @ts-expect-error
        const sunPosition = SunCalc.getPosition(date, ...location).altitude;
        return Math.max(
          0,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          isNaN(sunPosition) ? 1 : sunPosition
        );
      }
    );
    const maxPosition = Math.max(...positions);
    positions = positions.map(position => position / maxPosition);
    // eslint-disable-next-line no-new
    new Chart(node.querySelector('.weather-chart'), {
      ...commonChartOptions,
      colors: ['#FFD600', '#304FFE', '#2979FF', '#40C4FF', '#84FFFF'],
      data: {
        datasets: [
          {
            name: 'Sonne',
            values: json.hourly.map(
              (
                hour,
                index
              ) => parseInt(hour.chanceofsunshine, 10) * positions[index]
            )
          },
          {
            name: 'Regen',
            values: json.hourly.map(hour => hour.chanceofrain)
          },
          {
            name: 'Nebel',
            values: json.hourly.map(hour => hour.chanceoffog)
          },
          {
            name: 'Wolken',
            values: json.hourly.map(hour => hour.chanceofovercast)
          },
          {
            name: 'Schnee',
            values: json.hourly.map(hour => hour.chanceofsnow)
          }
        ],
        labels: json.hourly.map(hour => parseInt(hour.time, 10) / 100 + ' Uhr'),
        yMarkers: [
          { label: '', value: 0 },
          { label: '', value: 100 }
        ]
      },
      title: 'Wetterverlauf',
      tooltipOptions: {
        formatTooltipX: (/** @type {string|null} */ value) => {
          if (value === null) return '';
          const time = (parseInt(value, 10) * 100).toString();
          return value + ' | ' + json.hourly.find(
            item => item.time === time
          )?.lang_de[0]?.value;
        },
        formatTooltipY: (
          /** @type {number|null} */ value
        ) => value !== null ? Math.round(value) + ' %' : ''
      },
      type: 'line'
    });

    const sunHourValue = parseFloat(json.sunHour);
    sunrise.textContent = json.astronomy.at(0)?.sunrise ?? '?';
    sunset.textContent = json.astronomy.at(0)?.sunset ?? '?';
    sunHours.textContent = isNaN(sunHourValue)
      ? '?'
      : sunHourValue.toLocaleString('de');
    uvIndex.textContent = json.uvIndex;
  }
};
