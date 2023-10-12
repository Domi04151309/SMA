import {
  fetchDailyLoggers,
  fetchDashLoggers,
  fetchExactLoggers,
  fetchValues
} from './src/logging/fetchers.js';
import { getInverters, reloadInverters } from './src/inverters.js';
import {
  processDailyLoggers,
  processExactLoggers
} from './src/isomorphic/mappers/loggers.js';
import { Server } from './src/server.js';
import { getDevices } from './src/isomorphic/mappers/devices.js';
import { getLicenses } from './src/licenses.js';
import { getNow } from './src/isomorphic/mappers/values.js';
import { getWeather } from './src/weather.js';

/** @type {NowResponse[]} */
const historyData = await (async () => {
  const inverters = await getInverters();
  return processExactLoggers(
    getDevices(inverters, await fetchValues(inverters)).batteries[0],
    await fetchDashLoggers(inverters)
  );
})();

/**
 * @returns {Promise<void>}
 */
async function fetchNewData() {
  while (historyData.length > 288) historyData.shift();
  historyData.push(getNow(await fetchValues(await getInverters())));
}

await fetchNewData();
setTimeout(() => {
  setInterval(fetchNewData, 300_000);
}, Date.now() % 300_000);
setInterval(reloadInverters, 1000 * 60 * 60 * 24);

new Server()
  .registerApiEndpoint(
    '/daily',
    async request => processDailyLoggers(
      await fetchDailyLoggers(
        await getInverters(),
        parseInt(request.query.start?.toString() ?? '', 10),
        parseInt(request.query.end?.toString() ?? '', 10)
      )
    )
  )
  .registerApiEndpoint(
    '/devices',
    async () => getDevices(
      await getInverters(),
      await fetchValues(await getInverters())
    )
  )
  .registerApiEndpoint(
    '/exact',
    async request => {
      const inverters = await getInverters();
      return processExactLoggers(
        getDevices(inverters, await fetchValues(inverters)).batteries[0],
        await fetchExactLoggers(
          inverters,
          parseInt(request.query.start?.toString() ?? '', 10),
          parseInt(request.query.end?.toString() ?? '', 10)
        )
      );
    }
  )
  .registerApiEndpoint('/history', () => historyData)
  .registerApiEndpoint('/licenses', () => getLicenses())
  .registerApiEndpoint(
    '/now',
    async () => getNow(await fetchValues(await getInverters()))
  )
  .registerApiEndpoint(
    '/weather',
    async request => await getWeather(request.query.location?.toString() ?? '')
  )
  .registerTemplatedFile('/', 'index.html')
  .registerTemplatedFile('/forecast', 'forecast.html')
  .registerTemplatedFile('/history', 'history.html')
  .registerTemplatedFile('/settings', 'settings.html')
  .registerNodeModulesFile('/cubic-spline.js', 'cubic-spline/index.js')
  .registerNodeModulesFile(
    '/frappe-charts.min.esm.js',
    'frappe-charts/dist/frappe-charts.min.esm.js'
  )
  .registerNodeModulesFile(
    '/frappe-charts.min.esm.js.map',
    'frappe-charts/dist/frappe-charts.min.esm.js.map'
  )
  .registerNodeModulesFile('/suncalc.js', 'suncalc/suncalc.js')
  .start();
