/* global SunCalc */
import '/suncalc.js';
import { Chart, commonChartOptions, error } from '/components/charts.js';
import { Settings } from '../utils/settings.js';
// @ts-expect-error
import Spline from '/cubic-spline.js';

const INVALID_LAYOUT = 'Invalid layout';

export const ForecastSection = {
  error(/** @type {DocumentFragment|Element|null} */ node) {
    if (node === null) throw new Error(INVALID_LAYOUT);
    error(node.querySelector('.forecast-chart'), {
      title: 'Vorhersage'
    });
  },
  update(
    /** @type {DocumentFragment|Element|null} */ node,
    /** @type {WeatherResponse} */ json,
    /** @type {number} */ maxPower
  ) {
    if (node === null) throw new Error(INVALID_LAYOUT);
    const location = Settings.getItem('location')
      ?.split(',', 2)
      .map(parseFloat) ?? [];
    const date = new Date(json.date);
    const spline = new Spline(
      json.hourly.map(hour => parseInt(hour.time, 10) / 100),
      json.hourly.map(
        hour => [
          parseInt(hour.chanceofsunshine, 10) / 100,
          1 - parseInt(hour.chanceofovercast, 10) / 100,
          1 - parseInt(hour.cloudcover, 10) / 100
        ].reduce(
          (accumulator, item) => accumulator + item,
          0
        ) / 3 * (3 / 4) + 0.25
      )
    );
    // eslint-disable-next-line no-new
    new Chart(node.querySelector('.forecast-chart'), {
      ...commonChartOptions,
      barOptions: { spaceRatio: 0.1 },
      data: {
        datasets: [
          {
            name: 'Leistung',
            values: Array.from(
              { length: 22 },
              (_, hour) => {
                date.setHours(hour);
                return Math.max(
                  0,
                  /* @ts-expect-error */// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                  SunCalc.getPosition(date, ...location).altitude
                ) / (Math.PI / 2) * spline.at(hour) * maxPower;
              }
            )
          }
        ],
        labels: Array.from({ length: 22 }, (_, hour) => hour + ' Uhr'),
        yMarkers: [
          { label: '', value: 0 },
          { label: '', value: 100 }
        ]
      },
      title: 'Vorhersage',
      tooltipOptions: {
        formatTooltipY: (
          /** @type {number|null} */ value
        ) => value !== null
          ? Math.round(value).toLocaleString('de') + ' Wh'
          : ''
      },
      type: 'bar'
    });
  }
};
