import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { INVERTERS_FILE } from './config.js';
import { InverterSession } from './inverter-session.js';
import { allSettledHandling } from './fetch-utils.js';
import { fileURLToPath } from 'node:url';
import ip from 'ip';
import { networkInterfaces } from 'node:os';

/** @type {InverterSession[]} */
const inverters = [];

/**
 * @param {string} ipAddress
 * @returns {Promise<string|null>}
 */
async function isInverter(ipAddress) {
  try {
    const response = await fetch(
      'https://' + ipAddress + '/dyn/getDashTime.json'
    );
    if (response.status !== 200) return null;
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
    'Session',
    session => inverters.push(session)
  );
  writeFileSync(invertersFilePath, JSON.stringify(mappedInverters, null, 2));
  console.warn(
    'Found the following compatible devices:',
    discoveredInverters.join(', ')
  );
}

/**
 * @param {string} path
 * @returns {Promise<void>}
 */
async function invalidateSessionFromFile(path) {
  const file = JSON.parse(readFileSync(path).toString());
  if (typeof file.address === 'string' && typeof file.sessionId === 'string') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const session = new InverterSession(file.address, file.sessionId);
    if (await session.logout()) unlinkSync(path);
  }
}

/**
 * @returns {Promise<void>}
 */
async function invalidateOldSessions() {
  const logFileDirectory = fileURLToPath(
    new URL('../sessions/', import.meta.url)
  );
  if (!existsSync(logFileDirectory)) return;
  await Promise.all(
    readdirSync(logFileDirectory).map(
      filename => invalidateSessionFromFile(logFileDirectory + filename)
    )
  );
}

/**
 * @param {InverterSession} session
 * @returns {void}
 */
function saveSession(session) {
  const logFileDirectory = fileURLToPath(
    new URL('../sessions/', import.meta.url)
  );
  if (!existsSync(logFileDirectory)) mkdirSync(logFileDirectory);
  if (session.sessionId !== null) writeFileSync(
    logFileDirectory + Date.now() + '.' +
      session.address.replaceAll(/[^\dA-Za-z]/gu, '_') + '.json',
    JSON.stringify(session, null, 2)
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
      'Session',
      session => {
        saveSession(session);
        inverters.push(session);
      }
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
