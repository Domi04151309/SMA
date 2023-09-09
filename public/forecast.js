import { WeatherSection } from '/components/weather-section.js';
import { fetchApiData } from '/utils/api.js';

const [main] = document.getElementsByTagName('main');
const template = document.getElementsByTagName('template')[0].content;

await fetchApiData('/weather', (/** @type {WeatherResponse[]} */json) => {
  for (const date of json) {
    const clone = template.cloneNode(true);
    if (!(clone instanceof DocumentFragment)) return;
    const title = clone.querySelector('.weather-title');
    if (title !== null) title.textContent = new Date(date.date)
      .toLocaleDateString(
        'de-DE',
        { day: 'numeric', month: 'long', year: 'numeric' }
      );
    WeatherSection.update(clone, date);
    main.append(clone);
  }
});
