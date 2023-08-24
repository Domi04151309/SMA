import { existsSync, readFileSync, writeFileSync } from 'fs';
import express from 'express';
import { getData } from './fetcher.js';
import open from 'open';

const HISTORY_FILE = 'historyData.json';
const PORT = 3000;

const historyData = [];
const app = express();

try {
  if (existsSync(HISTORY_FILE)) historyData.push(
    ...JSON.parse(readFileSync(HISTORY_FILE))
  );
} catch (exception) {
  console.error('Failed opening history file!', exception);
}

async function fetchNewData() {
  while (historyData.length > 8_640) historyData.pop();
  historyData.push(await getData());
}

await fetchNewData();
setInterval(fetchNewData, 10000);

app.use(express.static('assets'));

app.get('/api/history', (_, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.send(historyData);
});

app.get('/api/now', (_, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.send(historyData.at(-1));
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}/`;
  // eslint-disable-next-line no-console
  console.log(url);
  open(url);
});

function exitHandler(options) {
  if (options.cleanup) writeFileSync(HISTORY_FILE, JSON.stringify(historyData));
  if (options.exit) process.exit();
}

process.on('exit', exitHandler.bind(null, { cleanup: true }));
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
