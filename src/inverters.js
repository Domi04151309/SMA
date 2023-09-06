process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { INVERTERS_FILE } from './config.js';
import { fileURLToPath } from 'node:url';
import ip from 'ip';
import { networkInterfaces } from 'node:os';

/** @type {InverterCredentials[]} */
const inverters = [];

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
  inverters.push(...mappedInverters);
  writeFileSync(invertersFilePath, JSON.stringify(mappedInverters, null, 2));
  console.warn(
    'Found the following compatible devices:',
    discoveredInverters.join(', ')
  );
}

/**
 * @returns {Promise<InverterCredentials[]>}
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    inverters.push(...fileContent);
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
