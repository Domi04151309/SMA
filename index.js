import { HISTORY_FILE, PERSISTENT_HISTORY } from './src/config.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { getDevices, getLiveData } from './src/mapper.js';
import { Server } from './src/server.js';
import { fetchDeviceData } from './src/fetcher.js';
import { getWeather } from './src/weather.js';

const ACCESS_CONTROL_ALLOW_ORIGIN = 'Access-Control-Allow-Origin';

const historyData = [];

function exitHandler(options) {
  if (options.cleanup) writeFileSync(HISTORY_FILE, JSON.stringify(historyData));
  // eslint-disable-next-line unicorn/no-process-exit
  if (options.exit) process.exit();
}

async function fetchNewData(prefetched = null) {
  while (historyData.length > 8640) historyData.shift();
  historyData.push(await getLiveData(prefetched));
}

if (PERSISTENT_HISTORY) {
  try {
    if (existsSync(HISTORY_FILE)) historyData.push(
      ...JSON.parse(readFileSync(HISTORY_FILE))
    );
  } catch (error) {
    console.error('Failed opening history file!', error);
  }
  process.on('exit', exitHandler.bind(null, { cleanup: true }));
  process.on('SIGINT', exitHandler.bind(null, { exit: true }));
  process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
  process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
}

const deviceData = await fetchDeviceData();
const devices = await getDevices(deviceData);
await fetchNewData(deviceData);
setInterval(fetchNewData, 10_000);

new Server().registerApiEndpint('/history', () => historyData)
  .registerApiEndpint('/now', () => historyData.at(-1))
  .registerApiEndpint('/devices', () => devices)
  .registerApiEndpint('/weather', async () => await getWeather())
  .start();
