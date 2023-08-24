import { HISTORY_FILE, PERSISTENT_HISTORY, PORT } from './src/config.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import compression from 'compression';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { getData } from './src/fetcher.js';
import open from 'open';

const historyData = [];
const app = express();

function exitHandler(options) {
  if (options.cleanup) writeFileSync(HISTORY_FILE, JSON.stringify(historyData));
  // eslint-disable-next-line unicorn/no-process-exit
  if (options.exit) process.exit();
}

async function fetchNewData() {
  while (historyData.length > 8640) historyData.shift();
  historyData.push(await getData());
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

await fetchNewData();
setInterval(fetchNewData, 10_000);

app.disable('x-powered-by');
app.use(compression());
app.use(express.static('public'));

app.get('/api/history', (_, response) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.send(historyData);
});

app.get('/api/now', (_, response) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.send(historyData.at(-1));
});

app.get('/frappe-charts.js', (_, response) => {
  response.sendFile(
    fileURLToPath(
      new URL(
        'node_modules/frappe-charts/dist/frappe-charts.min.esm.js',
        import.meta.url
      )
    )
  );
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}/`;
  // eslint-disable-next-line no-console
  console.log(url);
  open(url);
});
