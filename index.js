import { HISTORY_FILE, PERSISTENT_HISTORY } from './src/config.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { getDevices, getLiveData } from './src/mapper.js';
import { Server } from './src/server.js';
import { fetchDeviceData } from './src/fetcher.js';
import { getWeather } from './src/weather.js';

/** @type {NowResponse[]} */
const historyData = [];
/** @type {DevicesResponse|null} */
let devices = null;

/**
 *
 * @param {{ cleanup?: boolean, exit?: boolean}} options
 * @returns {void}
 */
function exitHandler(options) {
  if (options.cleanup) writeFileSync(HISTORY_FILE, JSON.stringify(historyData));
  // eslint-disable-next-line unicorn/no-process-exit
  if (options.exit) process.exit();
}

/**
 * @returns {Promise<void>}
 */
async function fetchNewData() {
  while (historyData.length > 8640) historyData.shift();
  const deviceData = await fetchDeviceData();
  historyData.push(await getLiveData(deviceData));
  devices = await getDevices(deviceData);
}

if (PERSISTENT_HISTORY) {
  try {
    if (existsSync(HISTORY_FILE)) historyData.push(
      ...JSON.parse(readFileSync(HISTORY_FILE).toString())
    );
  } catch (error) {
    console.error('Failed opening history file!', error);
  }
  process.on('exit', exitHandler.bind(null, { cleanup: true }));
  process.on('SIGINT', exitHandler.bind(null, { exit: true }));
  process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
  process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
}

await fetchNewData();
setInterval(fetchNewData, 10_000);

new Server().registerApiEndpoint('/history', () => historyData)
  .registerApiEndpoint('/now', () => historyData.at(-1))
  .registerApiEndpoint('/devices', () => devices)
  .registerApiEndpoint('/weather', async () => await getWeather())
  .start();
