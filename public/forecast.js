import { fetchApiData, fetchWeatherData } from '/utils/api.js';
import { ForecastSection } from '/components/forecast-section.js';
import { WeatherSection } from '/components/weather-section.js';

let energyUsed = 0;
let maxPower = 0;

const dailyEnd = new Date();
dailyEnd.setHours(0, 0, 0, 0);
dailyEnd.setDate(dailyEnd.getDate() - 1);
const dailyStart = new Date(dailyEnd);
dailyStart.setDate(dailyStart.getDate() - 7);
const dailyRequest = fetchApiData(
  '/daily?start=' + dailyStart.getTime() + '&end=' + dailyEnd.getTime(),
  (/** @type {DailyResponse[]} */ daily) => {
    const energyUsedLastWeek = daily.map(
      (item, index) => index < daily.length - 1
        ? Math.max(
          0,
          daily[index + 1].energy.fromRoof - item.energy.fromRoof -
          (daily[index + 1].energy.toGrid - item.energy.toGrid) -
          (daily[index + 1].energy.toBattery - item.energy.toBattery) +
          daily[index + 1].energy.fromBattery - item.energy.fromBattery +
          daily[index + 1].energy.fromGrid - item.energy.fromGrid
        )
        : 0
    )
      .slice(0, -1)
      .sort((first, second) => first - second);
    energyUsed = Math.round(
      energyUsedLastWeek[Math.round(energyUsedLastWeek.length / 2)] / 1000
    );
  }
);

const devicesRequest = fetchApiData(
  '/devices',
  (/** @type {DevicesResponse} */ devices) => {
    maxPower = devices.clusters.reduce(
      (accumulator, currentValue) => accumulator + currentValue.power,
      0
    );
  }
);

await fetchWeatherData(async (/** @type {WeatherResponse} */ json) => {
  await Promise.all([dailyRequest, devicesRequest]);
  const [main] = document.getElementsByTagName('main');
  const template = document.getElementsByTagName('template')[0].content;
  document.getElementById('loading')?.remove();
  const location = json.nearest_area?.at(0) ?? null;
  if (location === null) return;
  for (const date of json.weather ?? []) {
    const clone = template.cloneNode(true);
    if (!(clone instanceof DocumentFragment)) return;
    const title = clone.querySelector('.weather-title');
    if (title !== null) title.textContent = new Date(date.date)
      .toLocaleDateString(
        'de-DE',
        { day: 'numeric', month: 'long', year: 'numeric' }
      );
    WeatherSection.update(clone, location, date);
    ForecastSection.update(clone, location, date, maxPower, energyUsed);
    main.append(clone);
  }
});
