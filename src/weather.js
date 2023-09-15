import { Settings } from './settings.js';
import { fetchJson } from './fetch-utils.js';

const HOUR_IN_MILLISECONDS = 3.6e6;

/** @type {WeatherResponse} */
let weather = {};
let lastRefresh = 0;

/**
 * @returns {Promise<WeatherResponse>}
 */
export async function getWeather() {
  if (
    Object.keys(weather).length > 0 &&
    Date.now() - lastRefresh < HOUR_IN_MILLISECONDS
  ) return weather;
  try {
    const json = await fetchJson('https://wttr.in/' +
      Settings.getItem('location') + '?lang=de&format=j1');
    if (json === null) throw new Error('Fetch failed');
    if (Settings.getItem('location').length === 0) {
      Settings.setItem(
        'location',
        [
          json.nearest_area[0].latitude,
          json.nearest_area[0].longitude
        ].join(',')
      );
      Settings.save();
    }
    // eslint-disable-next-line require-atomic-updates
    weather = json;
    // eslint-disable-next-line require-atomic-updates
    lastRefresh = Date.now();
    return weather;
  } catch (error) {
    console.error(
      'Failed getting weather:',
      error instanceof Error ? error.message : error
    );
    return {};
  }
}
