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
    /** @type {number} */ maxPower,
    /** @type {number} */ energyUsed
  ) {
    if (node === null) throw new Error(INVALID_LAYOUT);
    const generation = node.querySelector('.forecast-generation');
    const consumption = node.querySelector('.forecast-consumption');
    if (
      generation === null ||
      consumption === null
    ) throw new Error(INVALID_LAYOUT);
    const date = new Date(json.date);
    const latitude = Number.parseFloat(location.latitude);
    const longitude = Number.parseFloat(location.longitude);
    const spline = new Spline(
      json.hourly.map(hour => Number.parseInt(hour.time, 10) / 100),
      json.hourly.map(
        hour => [
          Number.parseInt(hour.chanceofsunshine, 10) / 100,
          1 - Number.parseInt(hour.chanceofovercast, 10) / 100,
          1 - Number.parseInt(hour.cloudcover, 10) / 100
        ].reduce(
          (accumulator, item) => accumulator + item,
          0
        ) / 3 * WEATHER_WEIGHT + 1 - WEATHER_WEIGHT
      )
    );
    const forecast = Array.from(
      { length: 22 },
      (_, hour) => {
        date.setHours(hour);
        return Math.max(
          0,
          /* @ts-expect-error */// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          SunCalc.getPosition(date, latitude, longitude).altitude
        ) / (Math.PI / 2) * spline.at(hour) * maxPower * SCALE_FACTOR;
      }
    );
    generation.textContent = Math.round(
      forecast.reduce(
        (accumulator, value) => accumulator + value,
        0
      ) / 1000
    ).toString();
    consumption.textContent = energyUsed.toString();
    // eslint-disable-next-line no-new, sonarjs/constructor-for-side-effects
    new Chart(node.querySelector('.forecast-chart'), {
      ...commonChartOptions,
      data: {
        datasets: [
          {
            name: 'Leistung',
            values: forecast
          }
        ],
        labels: Array.from(
          { length: 22 },
          (_, hour) => `${hour.toString()} Uhr`
        ),
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
          ? `${Math.round(value).toLocaleString('de')} W`
          : ''
      },
      type: 'bar'
    });
  }
};
