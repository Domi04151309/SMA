import { allSettledHandling, fetchJson } from './fetch-utils.js';
import { LOGGER_MAP } from './isomorphic/logger-map.js';
import { OBJECT_MAP } from './isomorphic/object-map.js';

/**
 * @param {SMATranslation|null} translations
 * @param {SMAValuesValue[]} values
 * @returns {SMAValuesPureValue|SMAValuesPureValue[]}
 */
function parseValues(translations, values) {
  const convertedValues = values.map(
    value => {
      const innerValue = value.val;
      if (
        Array.isArray(innerValue) && 'tag' in (innerValue[0] ?? {})
      ) return translations === null
        ? '#' + innerValue[0]?.tag
        : translations[innerValue[0]?.tag];
      return innerValue;
    }
  );
  return convertedValues.length === 1 ? convertedValues[0] : convertedValues;
}

export class InverterSession {
  /** @type {SMATranslation|null} */
  #translations = null;

  constructor(
    /** @type {string} */ address,
    /** @type {string|null} */ sessionId
  ) {
    this.address = address;
    this.sessionId = sessionId;
  }

  /**
   * @param {InverterCredentials} inverter
   * @returns {Promise<InverterSession>}
   */
  static async create(inverter) {
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
      if (json.err === 503) throw new Error('Login currently unavailable');
      return typeof json === 'object' &&
        'result' in json &&
        typeof json.result === 'object' &&
        json.result !== null &&
        'sid' in json.result &&
        typeof json.result.sid === 'string'
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        ? new InverterSession(inverter.address, json.result.sid)
        : new InverterSession(inverter.address, null);
    } catch (error) {
      console.error(
        'Failed logging in at ' + inverter.address + ':',
        error instanceof Error ? error.message : error
      );
      return new InverterSession(inverter.address, null);
    }
  }

  /**
   * @returns {Promise<SMATranslation|null>}
   */
  async getTranslations() {
    if (this.#translations === null) this.#translations = await fetchJson(
      'https://' + this.address + '/data/l10n/de-DE.json'
    );
    return this.#translations;
  }

  /**
   * @returns {Promise<SMASimplifiedValues|null>}
   */
  async getValues() {
    /** @type {SMAValuesResult[]} */
    const responses = [];
    /** @type {{[key: string]: SMAValuesPureValue|SMAValuesPureValue[]}} */
    const result = {};
    if (this.sessionId === null) {
      /** @type {SMAValues|null} */
      const json = await fetchJson(
        'https://' + this.address + '/dyn/getDashValues.json'
      );
      if (json?.result) responses.push(json.result);
    } else await allSettledHandling(
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
      'Values',
      (/** @type {SMAValues} */ json) => {
        if (json.result) responses.push(json.result);
      }
    );

    if (responses.length === 0) return null;
    const [layerTwoKey] = Object.keys(responses[0]);
    for (const response of responses) for (
      const [key, value] of Object.entries(response[layerTwoKey])
    ) if (key in OBJECT_MAP) result[OBJECT_MAP[key]] = parseValues(
      // eslint-disable-next-line no-await-in-loop
      await this.getTranslations(),
      Object.values(value)[0]
    );
    // @ts-expect-error
    return Object.keys(result).length === 0 ? null : result;
  }

  /**
   * @returns {Promise<SMASimplifiedLogger|null>}
   */
  async getLogger() {
  /** @type {SMALogger|null} */
    const json = await fetchJson(
      'https://' + this.address + '/dyn/getDashLogger.json'
    );
    if (json === null) return null;
    return Object.fromEntries(
      Object.entries(Object.values(json.result)[0])
        .map(([key, value]) => [LOGGER_MAP[key], Object.values(value)[0]])
    );
  }

  /**
   * @param {number[]} keys
   * @param {number} start
   * @param {number} end
   * @returns {Promise<SMASimplifiedLogger|null>}
   */
  async #getLoggerByKeys(keys, start, end) {
    if (this.sessionId === null) return null;
    /** @type {{[key: string]: SMALoggerDataPoint[]}} */
    const response = {};
    await allSettledHandling(
      keys.map(key => fetchJson(
        'https://' + this.address + '/dyn/getLogger.json?sid=' + this.sessionId,
        {
          destDev: [],
          key,
          tEnd: end,
          tStart: start
        }
      )),
      'Loggers',
      (/** @type {SMASingleLogger} */ json, index) => {
        if (
          typeof json !== 'object' ||
          !('result' in json)
        ) return;
        const [layerTwoKey] = Object.keys(json.result);
        if (
          json.result[layerTwoKey].length > 0
        ) response[LOGGER_MAP[keys[index]]] = json.result[layerTwoKey];
      }
    );
    return Object.keys(response).length === 0 ? null : response;
  }

  /**
   * @param {number} start
   * @param {number} end
   * @returns {Promise<SMASimplifiedLogger|null>}
   */
  async getExact(/** @type {number} */ start, /** @type {number} */ end) {
    return await this.#getLoggerByKeys(
      [10_016, 28_672, 28_736, 28_816, 29_344, 29_360],
      start,
      end
    );
  }

  /**
   * @param {number} start
   * @param {number} end
   * @returns {Promise<SMASimplifiedLogger|null>}
   */
  async getDaily(/** @type {number} */ start, /** @type {number} */ end) {
    return await this.#getLoggerByKeys(
      [28_704, 28_752, 28_768, 29_344, 29_360],
      start,
      end
    );
  }

  /**
   * @returns {Promise<boolean>}
   */
  async logout() {
    /** @type {unknown} */
    const result = await fetchJson(
      'https://' + this.address + '/dyn/logout.json?sid=' + this.sessionId,
      {}
    );
    return typeof result === 'object' && result !== null;
  }
}
