import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { INVERTERS_FILE } from './config.js';
import { fileURLToPath } from 'node:url';
import { findInverters } from './discovery.js';

/** @type {string[]} */
const inverters = [];

/**
 * @param {string} invertersFilePath
 * @returns {Promise<string[]>}
 */
async function autofillInverters(invertersFilePath) {
  console.warn('Searching for inverters...');
  const discoveredInverters = await findInverters();
  writeFileSync(invertersFilePath, JSON.stringify(discoveredInverters));
  console.warn(
    'Found the following compatible devices:',
    discoveredInverters.join(', ')
  );
  return discoveredInverters;
}

/**
 * @returns {Promise<string[]>}
 */
export async function getAddresses() {
  if (inverters.length > 0) return inverters;

  const invertersFilePath = fileURLToPath(
    new URL('../' + INVERTERS_FILE, import.meta.url)
  );
  if (existsSync(invertersFilePath)) try {
    inverters.push(...JSON.parse(readFileSync(invertersFilePath).toString()));
  } catch (error) {
    console.error(
      'Failed opening inverter file:',
      error instanceof Error ? error.message : error
    );
  }
  else try {
    inverters.push(...await autofillInverters(invertersFilePath));
  } catch {
    writeFileSync(invertersFilePath, JSON.stringify([]));
    console.warn(
      'Please enter your converters\' ip addresses in the `' +
      INVERTERS_FILE + '` file!'
    );
  }
  return inverters;
}
