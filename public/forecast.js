import { ForecastSection } from '/components/forecast-section.js';
import { WeatherSection } from '/components/weather-section.js';
import { fetchApiData } from '/utils/api.js';

await fetchApiData('/weather', async (/** @type {WeatherResponse} */json) => {
  const [main] = document.getElementsByTagName('main');
  const template = document.getElementsByTagName('template')[0].content;
  let maxPower = 0;
  await fetchApiData('/devices', (/** @type {DevicesResponse} */devices) => {
    maxPower = devices.clusters.reduce(
      (accumulator, currentValue) => accumulator + currentValue.power,
      0
    );
  });
  document.getElementById('loading')?.remove();
  for (const date of json.weather ?? []) {
    const clone = template.cloneNode(true);
    if (!(clone instanceof DocumentFragment)) return;
    const title = clone.querySelector('.weather-title');
    if (title !== null) title.textContent = new Date(date.date)
      .toLocaleDateString(
        'de-DE',
        { day: 'numeric', month: 'long', year: 'numeric' }
      );
    WeatherSection.update(clone, date);
    ForecastSection.update(clone, date, maxPower);
    main.append(clone);
  }
});
