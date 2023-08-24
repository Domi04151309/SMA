import { HISTORY_FILE, PERSISTENT_HISTORY, PORT } from './src/config.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import compression from 'compression';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { getData } from './src/fetcher.js';
import open from 'open';

const historyData = [];
const app = express();

function exitHandler(options) {
  if (options.cleanup) writeFileSync(HISTORY_FILE, JSON.stringify(historyData));
  if (options.exit) process.exit();
}

async function fetchNewData() {
  while (historyData.length > 8_640) historyData.shift();
  historyData.push(await getData());
}

if (PERSISTENT_HISTORY) {
  try {
    if (existsSync(HISTORY_FILE)) historyData.push(
      ...JSON.parse(readFileSync(HISTORY_FILE))
    );
  } catch (exception) {
    console.error('Failed opening history file!', exception);
  }
  process.on('exit', exitHandler.bind(null, { cleanup: true }));
  process.on('SIGINT', exitHandler.bind(null, { exit: true }));
  process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
  process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
}

await fetchNewData();
setInterval(fetchNewData, 10000);

app.disable('x-powered-by');
app.use(compression());
app.use(express.static('public'));

app.get('/api/history', (_, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.send(historyData);
});

app.get('/api/now', (_, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.send(historyData.at(-1));
});

app.get('/frappe-charts.js', (req, res) => {
  res.sendFile(
    fileURLToPath(
      new URL(
        './node_modules/frappe-charts/dist/frappe-charts.min.esm.js',
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
