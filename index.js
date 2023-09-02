import { constructHistory, getDevices, getLiveData } from './src/mapper.js';
import { Server } from './src/server.js';
import { fetchDeviceData } from './src/fetcher.js';
import { getWeather } from './src/weather.js';

/** @type {NowResponse[]} */
const historyData = await constructHistory();

/**
 * @returns {Promise<void>}
 */
async function fetchNewData() {
  while (historyData.length > 288) historyData.shift();
  const deviceData = await fetchDeviceData();
  historyData.push(await getLiveData(deviceData));
}

await fetchNewData();
setInterval(fetchNewData, 300_000);

new Server().registerApiEndpoint('/history', () => historyData)
  .registerApiEndpoint('/now', async () => await getLiveData())
  .registerApiEndpoint('/devices', async () => await getDevices())
  .registerApiEndpoint('/weather', async () => await getWeather())
  .start();
