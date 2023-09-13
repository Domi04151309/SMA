process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { allSettledHandling, fetchJson } from './fetch-utils.js';
import {
  existsSync,
  mkdirSync,
  writeFileSync
} from 'node:fs';
import { fileURLToPath } from 'node:url';

/** @type {{[index: string]: string}} */
const LOGGER_MAP = {
  10_016: 'PvGen_PvW',
  28_672: 'Metering_TotWhOut',
  28_736: 'Metering_GridMs_TotWhIn',
  28_816: 'Battery_ChaStt'
};

/* eslint-disable @typescript-eslint/no-unsafe-return */
export class InverterSession {
  constructor(
    /** @type {string} */ address,
    /** @type {string|null} */ sessionId
  ) {
    this.address = address;
    this.sessionId = sessionId;
    const logFileDirectory = fileURLToPath(
      new URL('../sessions/', import.meta.url)
    );
    if (!existsSync(logFileDirectory)) mkdirSync(logFileDirectory);
    if (sessionId !== null) writeFileSync(
      logFileDirectory + Date.now() + '.' +
        this.address.replaceAll(/[^\dA-Za-z]/gu, '_') + '.json',
      JSON.stringify(this, null, 2)
    );
  }

  static async create(/** @type {InverterCredentials} */ inverter) {
    try {
      const json = await fetchJson(
        'https://' + inverter.address + '/dyn/login.json',
        {
          pass: inverter.password,
          right: inverter.group
        }
      );
      if (json === null) throw new Error('Fetch failed');
      if (json.err === 401) throw new Error('Wrong password');
      if (json.err === 503) throw new Error(
        'Login currently unavailable'
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return new InverterSession(inverter.address, json.result.sid);
    } catch (error) {
      console.error(
        'Failed logging in at ' + inverter.address + ':',
        error instanceof Error ? error.message : error
      );
      return new InverterSession(inverter.address, null);
    }
  }

  async getTranslations() {
    return await fetchJson('https://' + this.address + '/data/l10n/de-DE.json');
  }

  async getValues() {
    if (this.sessionId === null) return await fetchJson(
      'https://' + this.address + '/dyn/getDashValues.json'
    );
    /** @type {SMAValues[]} */
    const responses = [];
    await allSettledHandling(
      [
        fetchJson(
          'https://' + this.address + '/dyn/getAllParamValues.json?sid=' +
            this.sessionId,
          { destDev: [] }
        ),
        fetchJson(
          'https://' + this.address + '/dyn/getAllOnlValues.json?sid=' +
            this.sessionId,
          { destDev: [] }
        )
      ],
      'Failed fetching values',
      (/** @type {SMAValues} */ json) => {
        if (json.result) responses.push(json);
      }
    );
    if (responses.length === 0) return null;
    const [result] = responses;
    const [layerTwoKey] = Object.keys(result.result ?? {});
    if (result.result) for (
      const response of responses.slice(1)
    ) if (response.result) for (
      const [key, value] of Object.entries(response.result[layerTwoKey])
    ) result.result[layerTwoKey][key] = value;
    return result;
  }

  async getLogger() {
    return await fetchJson(
      'https://' + this.address + '/dyn/getDashLogger.json'
    );
  }

  async getExact(/** @type {number} */ start, /** @type {number} */ end) {
    if (this.sessionId === null) return null;
    /** @type {{[key: string]: SMALoggerDataPoint[]}} */
    const response = {};
    const keys = [10_016, 28_672, 28_736, 28_816];
    await allSettledHandling(
      keys.map(key => fetchJson(
        'https://' + this.address + '/dyn/getLogger.json?sid=' +
          this.sessionId,
        {
          destDev: [],
          key,
          tEnd: end,
          tStart: start
        }
      )),
      'Failed fetching values',
      (/** @type {SMASingleLogger} */ json, index) => {
        const [layerTwoKey] = Object.keys(json.result);
        if (
          json.result[layerTwoKey].length > 0
        ) response[LOGGER_MAP[keys[index]]] = json.result[layerTwoKey];
      }
    );
    return response;
  }
}
/* eslint-enable @typescript-eslint/no-unsafe-return */
