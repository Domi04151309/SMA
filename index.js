import { constructHistory, getDevices, getNow } from './src/mapper.js';
import { Server } from './src/server.js';
import { getLicenses } from './src/licenses.js';
import { getWeather } from './src/weather.js';

/** @type {NowResponse[]} */
const historyData = await constructHistory();

/**
 * @returns {Promise<void>}
 */
async function fetchNewData() {
  while (historyData.length > 288) historyData.shift();
  historyData.push(await getNow());
}

await fetchNewData();
setInterval(fetchNewData, 300_000);

new Server()
  .registerApiEndpoint('/devices', async () => await getDevices())
  .registerApiEndpoint('/history', () => historyData)
  .registerApiEndpoint('/licenses', () => getLicenses())
  .registerApiEndpoint('/now', async () => await getNow())
  .registerApiEndpoint('/weather', async () => await getWeather())
  .registerTemplatedFile('/', 'index.html')
  .registerTemplatedFile('/history', 'history.html')
  .registerTemplatedFile('/forecast', 'forecast.html')
  .registerTemplatedFile('/settings', 'settings.html')
  .registerNodeModulesFile(
    '/cubic-spline.js',
    'cubic-spline/index.js'
  )
  .registerNodeModulesFile(
    '/frappe-charts.min.esm.js',
    'frappe-charts/dist/frappe-charts.min.esm.js'
  )
  .registerNodeModulesFile(
    '/frappe-charts.min.esm.js.map',
    'frappe-charts/dist/frappe-charts.min.esm.js.map'
  )
  .registerNodeModulesFile(
    '/suncalc.js',
    'suncalc/suncalc.js'
  )
  .start();
