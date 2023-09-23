/* global SunCalc */
import '/suncalc.js';
import { Chart, commonChartOptions, error } from '/utils/charts.js';
// @ts-expect-error
import Spline from '/cubic-spline.js';

const INVALID_LAYOUT = 'Invalid layout';
const WEATHER_WEIGHT = 0.5;
const SCALE_FACTOR = 0.6;

export const ForecastSection = {
  error(/** @type {DocumentFragment|Element|null} */ node) {
    if (node === null) throw new Error(INVALID_LAYOUT);
    error(node.querySelector('.forecast-chart'), {
      title: 'Vorhersage'
    });
  },
  update(
    /** @type {DocumentFragment|Element|null} */ node,
    /** @type {WeatherArea} */ location,
    /** @type {WeatherDay} */ json,
    /** @type {number} */ maxPower
  ) {
    if (node === null) throw new Error(INVALID_LAYOUT);
    const date = new Date(json.date);
    const latitude = parseFloat(location.latitude);
    const longitude = parseFloat(location.longitude);
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
        ) / 3 * WEATHER_WEIGHT + 1 - WEATHER_WEIGHT
      )
    );
    // eslint-disable-next-line no-new
    new Chart(node.querySelector('.forecast-chart'), {
      ...commonChartOptions,
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
                  SunCalc.getPosition(date, latitude, longitude).altitude
                ) / (Math.PI / 2) * spline.at(hour) * maxPower * SCALE_FACTOR;
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
