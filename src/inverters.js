process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { allSettledHandling, fetchJson } from './fetch-utils.js';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { INVERTERS_FILE } from './config.js';
import { fileURLToPath } from 'node:url';
import ip from 'ip';
import { networkInterfaces } from 'node:os';

/** @type {InverterSession[]} */
const inverters = [];

/* eslint-disable @typescript-eslint/no-unsafe-return */
class InverterSession {
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
}
/* eslint-enable @typescript-eslint/no-unsafe-return */

/**
 * @param {string} ipAddress
 * @returns {Promise<string|null>}
 */
async function isInverter(ipAddress) {
  try {
    const response = await fetch(
      'https://' + ipAddress + '/dyn/getDashTime.json'
    ).catch(() => null);
    if (response === null || response.status !== 200) return null;
    return ipAddress;
  } catch {
    return null;
  }
}

/**
 * @returns {Promise<string[]>}
 */
async function findInverters() {
  const localInterface = Object.values(networkInterfaces())
    .flat()
    .find(
      item => item?.internal === false && ip.isPrivate(item.address)
    );

  if (!localInterface || !localInterface.cidr) throw new Error(
    'Unknown network configuration'
  );
  if (!ip.isV4Format(localInterface.address)) throw new Error(
    'IPv6 discovery is not supported yet'
  );

  /** @type {Promise<string|null>[]} */
  const promises = [];
  const subnet = ip.cidrSubnet(localInterface.cidr);
  const firstAddress = ip.toLong(subnet.firstAddress);
  const lastAddress = ip.toLong(subnet.lastAddress);
  for (
    let ipAddress = firstAddress; ipAddress <= lastAddress; ipAddress++
  ) promises.push(isInverter(ip.fromLong(ipAddress)));

  const results = await Promise.all(promises);
  return /** @type {string[]} */ (results.filter(item => item !== null));
}

/**
 * @param {string} invertersFilePath
 * @returns {Promise<void>}
 */
async function autofillInverters(invertersFilePath) {
  console.warn('Searching for inverters...');
  const discoveredInverters = await findInverters();
  const mappedInverters = discoveredInverters.map(address => ({
    address,
    group: 'usr',
    password: ''
  }));
  await allSettledHandling(
    mappedInverters.map(inverter => InverterSession.create(inverter)),
    'Failed creating session',
    session => inverters.push(session)
  );
  writeFileSync(invertersFilePath, JSON.stringify(mappedInverters, null, 2));
  console.warn(
    'Found the following compatible devices:',
    discoveredInverters.join(', ')
  );
}

/**
 * @param {string} address
 * @param {string} sessionId
 * @returns {Promise<boolean>}
 */
async function logout(address, sessionId) {
  const result = await fetchJson(
    'https://' + address + '/dyn/logout.json?sid=' + sessionId,
    {}
  );
  return 'result' in result;
}

/**
 * @param {string} path
 * @returns {Promise<void>}
 */
async function invalidateSessionFromFile(path) {
  const file = JSON.parse(
    readFileSync(path).toString()
  );
  if (
    typeof file.address === 'string' &&
    typeof file.sessionId === 'string' &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await logout(file.address, file.sessionId)
  ) unlinkSync(path);
}

/**
 * @returns {Promise<void>}
 */
async function invalidateOldSessions() {
  const logFileDirectory = fileURLToPath(
    new URL('../sessions/', import.meta.url)
  );
  if (!existsSync(logFileDirectory)) return;
  await Promise.allSettled(
    readdirSync(logFileDirectory).map(
      filename => invalidateSessionFromFile(logFileDirectory + filename)
    )
  );
}

/**
 * @param {string} content
 * @returns {InverterCredentials[]}
 * @throws {Error}
 */
function parseInverterFile(content) {
  const fileContent = JSON.parse(content);
  if (!Array.isArray(fileContent)) throw new Error('Not an array');
  if (
    !fileContent.every(
      item => typeof item === 'object' &&
      item !== null &&
      !Array.isArray(item)
    )
  ) throw new Error('Not all entries are objects');
  if (
    !fileContent.every(item => 'address' in item)
  ) throw new Error('Not all inverters have addresses');
  if (
    !fileContent.every(item => 'group' in item)
  ) throw new Error('Not all inverters have groups');
  if (
    !fileContent.every(item => 'password' in item)
  ) throw new Error('Not all inverters have passwords');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return fileContent;
}

/**
 * @returns {Promise<InverterSession[]>}
 */
export async function getInverters() {
  if (inverters.length > 0) return inverters;

  await invalidateOldSessions();
  const invertersFilePath = fileURLToPath(
    new URL('../' + INVERTERS_FILE, import.meta.url)
  );
  if (existsSync(invertersFilePath)) try {
    const fileContent = parseInverterFile(
      readFileSync(invertersFilePath).toString()
    );
    await allSettledHandling(
      fileContent.map(inverter => InverterSession.create(inverter)),
      'Failed creating session',
      session => inverters.push(session)
    );
  } catch (error) {
    console.error(
      'Failed opening inverter file:',
      error instanceof Error ? error.message : error
    );
  }
  else {
    try {
      await autofillInverters(invertersFilePath);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      writeFileSync(invertersFilePath, JSON.stringify([]));
    }
    console.warn(
      'Please enter your converters\' login credentials in the `' +
      INVERTERS_FILE + '` file!'
    );
  }
  return inverters;
}
