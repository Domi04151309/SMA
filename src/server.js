import { PORT } from './config.js';
import { Settings } from './settings.js';
import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import ip from 'ip';

export class Server {
  constructor() {
    this.app = express();
    this.app.use(helmet({
      contentSecurityPolicy: false,
      strictTransportSecurity: false
    }));
    this.app.use(compression());
    this.app.use(bodyParser.json());
    this.app.use(
      express.static(fileURLToPath(new URL('../public/', import.meta.url)))
    );
    this.registerNodeModulesFile(
      '/frappe-charts.min.esm.js',
      'frappe-charts/dist/frappe-charts.min.esm.js'
    );
    this.registerNodeModulesFile(
      '/frappe-charts.min.esm.js.map',
      'frappe-charts/dist/frappe-charts.min.esm.js.map'
    );
    this.registerApiEndpoint('/settings', request => {
      if (
        request.socket.remoteAddress &&
        ip.isPrivate(request.socket.remoteAddress)
      ) return Settings.get();
      return {};
    });
    this.app.put('/api/settings', (request, response) => {
      if (
        request.socket.remoteAddress &&
        ip.isPrivate(request.socket.remoteAddress)
      ) {
        for (
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const [key, value] of Object.entries(request.body)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        ) Settings.setItem(key, value.toString());
        Settings.save();
      }
      response.status(204).send();
    });
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
    /** @type {(request: express.Request) => unknown} */ getResponse
  ) {
    this.app.get('/api' + path, async (request, response) => {
      const sendableResponse = getResponse.constructor.name === 'AsyncFunction'
        ? await getResponse(request)
        : getResponse(request);
      response.set('Access-Control-Allow-Origin', '*');
      response.send(sendableResponse);
    });
    return this;
  }

  start() {
    this.app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log('http://localhost:' + PORT + '/');
    });
  }
}
