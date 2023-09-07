import { Settings } from './settings.js';
import { fetchJson } from './fetch-utils.js';

/** @type {WeatherResponse|null} */
let weather = null;

/**
 * @returns {Promise<WeatherResponse>}
 */
export async function getWeather() {
  if (
    weather !== null &&
    weather.date === new Date()
      .toISOString()
      .split('T')[0]
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
    [weather] = json.weather;
    return weather ?? {};
  } catch (error) {
    console.error(
      'Failed getting weather:',
      error instanceof Error ? error.message : error
    );
    return {};
  }
}
