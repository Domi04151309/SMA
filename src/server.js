import { OPEN_BROWSER_ON_START, PORT } from './config.js';
import compression from 'compression';
import express from 'express';
import { fileURLToPath } from 'node:url';
import open from 'open';

export class Server {
  constructor() {
    this.app = express();
    this.app.disable('x-powered-by');
    this.app.use(compression());
    this.app.use(express.static('public'));
    this.registerNodeModulesFile(
      '/frappe-charts.min.esm.js',
      'frappe-charts/dist/frappe-charts.min.esm.js'
    );
    this.registerNodeModulesFile(
      '/frappe-charts.min.esm.js.map',
      'frappe-charts/dist/frappe-charts.min.esm.js.map'
    );
  }

  registerNodeModulesFile(
    /** @type {string} */ path,
    /** @type {string} */ filePath
  ) {
    this.app.get(path, (_, response) => {
      response.sendFile(
        fileURLToPath(new URL('../node_modules/' + filePath, import.meta.url))
      );
    });
  }

  registerApiEndpoint(
    /** @type {string} */ path,
    /** @type {() => unknown} */ getResponse
  ) {
    this.app.get('/api' + path, async (_, response) => {
      const sendableResponse = getResponse.constructor.name === 'AsyncFunction'
        ? await getResponse()
        : getResponse();
      response.set('Access-Control-Allow-Origin', '*');
      response.send(sendableResponse);
    });
    return this;
  }

  start() {
    this.app.listen(PORT, () => {
      const url = 'http://localhost:' + PORT + '/';
      // eslint-disable-next-line no-console
      console.log(url);
      if (OPEN_BROWSER_ON_START) open(url);
    });
  }
}