import { fetchJson } from './fetch-utils.js';

const HOUR_IN_MILLISECONDS = 3.6e6;

/** @type {WeatherResponse} */
let weather = {};
let lastLocation = '';
let lastRefresh = 0;

/**
 * @param {string} location
 * @returns {Promise<WeatherResponse>}
 */
export async function getWeather(location) {
  if (
    Object.keys(weather).length > 0 &&
    location === lastLocation &&
    Date.now() - lastRefresh < HOUR_IN_MILLISECONDS
  ) return weather;
  try {
    const json = await fetchJson('https://wttr.in/' +
      encodeURIComponent(location) + '?lang=de&format=j1');
    if (json === null) throw new Error('Fetch failed');
    /* eslint-disable require-atomic-updates */
    weather = json;
    lastLocation = location;
    lastRefresh = Date.now();
    /* eslint-enable require-atomic-updates */
    return weather;
  } catch (error) {
    console.error(
      'Weather:',
      error instanceof Error ? error.message : error
    );
    return {};
  }
}
