import { PORT } from './config.js';
import { Settings } from './settings.js';
import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import ip from 'ip';
import { lookup } from 'mime-types';
import { readFileSync } from 'node:fs';

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
      express.static(
        fileURLToPath(new URL('../public/', import.meta.url)),
        { index: false }
      )
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
      const fullFilePath = fileURLToPath(
        new URL('../node_modules/' + filePath, import.meta.url)
      );
      response.setHeader('content-type', lookup(fullFilePath) || '');
      const fileToSend = readFileSync(fullFilePath)
        .toString()
        .trim();
      response.send(
        fileToSend.startsWith('module.exports =')
          ? fileToSend.replaceAll('module.exports =', 'export default')
          : fileToSend
      );
    });
    return this;
  }

  registerTemplatedFile(
    /** @type {string} */ path,
    /** @type {string} */ filePath
  ) {
    this.app.get(path, (_, response) => {
      const fullFilePath = fileURLToPath(
        new URL('../public/' + filePath, import.meta.url)
      );
      let sourceFile = readFileSync(fullFilePath).toString();
      for (
        let instructionStart = sourceFile.indexOf('{%');
        instructionStart > -1;
        instructionStart = sourceFile.indexOf('{%')
      ) {
        const instructionEnd = sourceFile.slice(instructionStart)
          .indexOf('%}') + instructionStart + 2;
        const [instruction, parameter] = sourceFile.slice(
          instructionStart + 2,
          instructionEnd - 2
        ).trim()
          .split(' ', 2);
        if (instruction === 'include') sourceFile = sourceFile.slice(
          0,
          instructionStart
        ) + readFileSync(
          fileURLToPath(
            new URL('../public/_includes/' + parameter, import.meta.url)
          )
        ).toString() + sourceFile.slice(instructionEnd);
        else {
          console.warn(
            'Invalid instruction in',
            fullFilePath,
            'at',
            instructionStart
          );
          sourceFile = sourceFile.slice(0, instructionStart) +
            sourceFile.slice(instructionEnd);
        }
      }
      response.send(sourceFile);
    });
    return this;
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
