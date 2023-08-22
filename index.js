import express from 'express';
import { getData } from './fetcher.js';

const app = express();
const port = 3000;

app.use(express.static('assets'));

app.get('/api', async (_, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.send(await getData());
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`App listening on port ${port}`);
});
