process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import netmask from 'netmask';
import { networkInterfaces } from 'node:os';

/**
 *
 * @param {string} ip
 * @returns {Promise<string|null>}
 */
async function isInverter(ip) {
  try {
    const response = await fetch(
      'https://' + ip + '/dyn/getDashTime.json'
    ).catch(() => null);
    if (response === null || response.status !== 200) return null;
    return ip;
  } catch {
    return null;
  }
}

/**
 * @returns {Promise<string[]>}
 */
export async function findInverters() {
  const localInterface = Object.values(networkInterfaces())
    .flat()
    .find(item => item?.internal === false && item?.family === 'IPv4');

  if (!localInterface || !localInterface.cidr) throw new Error(
    'Unknown network configuration'
  );

  /** @type {Promise<string|null>[]} */
  const promises = [];

  // eslint-disable-next-line unicorn/no-array-for-each
  new netmask.Netmask(localInterface.cidr).forEach(ip => {
    promises.push(isInverter(ip));
  });

  const results = await Promise.all(promises);
  return /** @type {string[]} */ (results.filter(item => item !== null));
}
