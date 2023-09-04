process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import ip from 'ip';
import { networkInterfaces } from 'node:os';

/**
 *
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
export async function findInverters() {
  const localInterface = Object.values(networkInterfaces())
    .flat()
    .find(
      item => item?.internal === false && ip.isPrivate(item?.address)
    );

  if (!localInterface || !localInterface.cidr) throw new Error(
    'Unknown network configuration'
  );
  if (ip.isV6Format(localInterface.address)) throw new Error(
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
