let plantLocation = [];

async function getLocation() {
  if (plantLocation.length === 2) return plantLocation;
  try {
    const response = await fetch('http://ip-api.com/json/?fields=192');
    const json = await response.json();
    // eslint-disable-next-line require-atomic-updates
    plantLocation = Object.values(json);
  } catch (error) {
    console.error(error);
  }
  return plantLocation;
}

export async function getWeather() {
  try {
    const location = await getLocation();
    const response = await fetch('https://wttr.in/' + location.join(',') +
      '?lang=de&format=j1');
    const json = await response.json();
    return json.weather[0];
  } catch (error) {
    console.error(error);
    return {};
  }
}
