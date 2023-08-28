async function getLocation() {
  try {
    const response = await fetch('http://ip-api.com/json/?fields=192');
    const json = await response.json();
    return Object.values(json);
  } catch (error) {
    console.error(error);
    return [];
  }
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
