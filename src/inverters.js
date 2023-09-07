process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { allSettledHandling, fetchJson } from './fetch-utils.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { INVERTERS_FILE } from './config.js';
import { OBJECT_MAP } from './object-map.js';
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
  }

  static async create(/** @type {InverterCredentials} */ inverter) {
    try {
      const json = await fetchJson(
        'https://' + inverter.address + '/dyn/login.json',
        JSON.stringify({
          pass: inverter.password,
          right: inverter.group
        })
      );
      if (json === null) throw new Error('Fetch failed');
      if (json.err === 401) throw new Error('Wrong password');
      if (json.err === 503) throw new Error('Login currently unavailable');
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

  async getAllValues() {
    if (this.sessionId === null) return await fetchJson(
      'https://' + this.address + '/dyn/getDashValues.json'
    );
    /** @type {SMAValues|null} */
    const parameters = await fetchJson(
      'https://' + this.address + '/dyn/getAllParamValues.json?sid=' +
        this.sessionId,
      JSON.stringify({ destDev: [] })
    );
    /** @type {SMAValues|null} */
    const values = await fetchJson(
      'https://' + this.address + '/dyn/getAllOnlValues.json?sid=' +
        this.sessionId,
      JSON.stringify({ destDev: [] })
    );
    if (!parameters?.result || !values?.result) return null;
    return {
      result: Object.fromEntries(
        Object.entries(parameters.result).map(
          // @ts-expect-error
          ([key, value]) => [key, { ...value, ...values.result[key] }]
        )
      )
    };
  }

  async getValues() {
    if (this.sessionId === null) return await fetchJson(
      'https://' + this.address + '/dyn/getDashValues.json'
    );
    return await fetchJson(
      'https://' + this.address + '/dyn/getValues.json?sid=' +
        this.sessionId,
      JSON.stringify({
        destDev: [],
        keys: [
          'Bat_CapacRtgWh',
          'Bat_Diag_ActlCapacNom',
          'BatChrg_BatChrg',
          'BatDsch_BatDsch',
          'Battery_ChaStt',
          'Battery_CurrentCharging',
          'Battery_CurrentDischarging',
          'Energy_Meter_Add',
          'GridMs_TotW_Cur',
          'Metering_GridMs_TotWhIn',
          'Metering_GridMs_TotWhOut',
          'Metering_GridMs_TotWIn',
          'Metering_GridMs_TotWOut',
          'Metering_PvGen_PvWh',
          'Name_Model',
          'Name_Vendor',
          'Operation_Health',
          'Operation_RunStt',
          'PvGen_PvW'
          // @ts-expect-error
        ].map(key => OBJECT_MAP[key].obj + '_' + OBJECT_MAP[key].lri)
      })
    );
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
 * @returns {Promise<InverterSession[]>}
 */
export async function getInverters() {
  if (inverters.length > 0) return inverters;

  const invertersFilePath = fileURLToPath(
    new URL('../' + INVERTERS_FILE, import.meta.url)
  );
  if (existsSync(invertersFilePath)) try {
    const fileContent = JSON.parse(readFileSync(invertersFilePath).toString());
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
    await allSettledHandling(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
