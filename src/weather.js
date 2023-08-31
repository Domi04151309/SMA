/** @type {string[]} */
let plantLocation = [];
/** @type {WeatherResponse|null} */
let weather = null;

/**
 * @returns {Promise<string[]>}
 */
async function getLocation() {
  if (plantLocation.length === 2) return plantLocation;
  try {
    const response = await fetch('http://ip-api.com/json/?fields=192');
    const json = await response.json();
    // eslint-disable-next-line require-atomic-updates
    plantLocation = Object.values(json);
  } catch (error) {
    console.error(
      'Failed getting location:',
      error instanceof Error ? error.message : error
    );
  }
  return plantLocation;
}

/**
 * @returns {Promise<WeatherResponse|object>}
 */
export async function getWeather() {
  if (
    weather !== null &&
    weather.date === new Date()
      .toISOString()
      .split('T')[0]
  ) return weather;
  try {
    const location = await getLocation();
    const response = await fetch('https://wttr.in/' + location.join(',') +
      '?lang=de&format=j1');
    const json = await response.json();
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
