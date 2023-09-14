import {
  fetchDailyLoggers as fetchDailyLoggersOriginal,
  fetchDashLoggers as fetchDashLoggersOriginal,
  fetchExactLoggers as fetchExactLoggersOriginal,
  fetchValues as fetchValuesOriginal
} from '../isomorphic/fetchers.js';
import { logChart, logTable } from './utils.js';
import { PRINT_DEBUG_INFO } from '../config.js';

/**
 * @param {SMASimplifiedValues[]} values
 * @returns {void}
 */
function printValuesDebugInfo(values) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (PRINT_DEBUG_INFO) {
    /** @type {Set<string>} */
    const keys = new Set();
    for (const entry of values) for (
      const key of Object.keys(entry)
    ) keys.add(key);
    logTable(
      [...keys].sort().map(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        key => [
          key,
          /* @ts-expect-error */// eslint-disable-next-line @typescript-eslint/no-unsafe-return
          ...values.map(entry => entry[key])
        ]
      )
    );
  }
}

/**
 * @param {SMASimplifiedLogger[]} loggers
 * @returns {void}
 */
function printLoggerDebugInfo(loggers) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (PRINT_DEBUG_INFO) for (const logger of loggers) for (
    const [key, values] of /** @type {[string, SMALoggerDataPoint[]][]} */ (
      Object.entries(logger)
    )
  ) logChart(
    key,
    /** @type {number[]} */ (
      values
        .filter((_, index) => index % 3 === 0)
        .map(dataPoint => dataPoint.v)
        .filter(dataPoint => dataPoint !== null)
    )
  );
}

/**
 * @param {import('../inverter-session.js').InverterSession[]} inverters
 * @returns {Promise<SMASimplifiedValues[]>}
 */
export async function fetchValues(inverters) {
  const result = await fetchValuesOriginal(inverters);
  printValuesDebugInfo(result);
  return result;
}

/**
 * @param {import('../inverter-session.js').InverterSession[]} inverters
 * @returns {Promise<SMASimplifiedLogger[]>}
 */
export async function fetchDashLoggers(inverters) {
  const result = await fetchDashLoggersOriginal(inverters);
  printLoggerDebugInfo(result);
  return result;
}

/**
 * @param {import('../inverter-session.js').InverterSession[]} inverters
 * @param {number} start
 * @param {number} end
 * @returns {Promise<SMASimplifiedLogger[]>}
 */
export async function fetchExactLoggers(inverters, start, end) {
  const result = await fetchExactLoggersOriginal(inverters, start, end);
  printLoggerDebugInfo(result);
  return result;
}

/**
 * @param {import('../inverter-session.js').InverterSession[]} inverters
 * @param {number} start
 * @param {number} end
 * @returns {Promise<SMASimplifiedLogger[]>}
 */
export async function fetchDailyLoggers(inverters, start, end) {
  const result = await fetchDailyLoggersOriginal(inverters, start, end);
  printLoggerDebugInfo(result);
  return result;
}
