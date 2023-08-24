import express from 'express';
import { getData } from './fetcher.js';
import open from 'open';

const app = express();
const port = 3000;

const historicalData = [];

async function fetchNewData() {
  while (historicalData.length > 8_640) historicalData.pop();
  historicalData.push(await getData());
}

await fetchNewData();
setInterval(fetchNewData, 10000);

app.use(express.static('assets'));

app.get('/api/history', (_, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.send(historicalData);
});

app.get('/api/now', (_, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.send(historicalData.at(-1));
});

app.listen(port, () => {
  const url = `http://localhost:${port}/`;
  // eslint-disable-next-line no-console
  console.log(url);
  open(url);
});
