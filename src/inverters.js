import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { INVERTERS_FILE } from './config.js';
import { fileURLToPath } from 'node:url';

/** @type {string[]} */
const inverters = [];

/**
 * @returns {string[]}
 */
export function getAddresses() {
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
  } else {
    writeFileSync(invertersFilePath, JSON.stringify([]));
    console.warn(
      'Please enter your converters\' ip addresses in the `' + INVERTERS_FILE +
        '` file!'
    );
  }
  return inverters;
}
