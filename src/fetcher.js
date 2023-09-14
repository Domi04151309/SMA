import { logChart, logTable } from './log-utils.js';
import { OBJECT_MAP } from './object-map.js';
import { PRINT_DEBUG_INFO } from './config.js';
import { allSettledHandling } from './fetch-utils.js';
import { getInverters } from './inverters.js';

/** @type {{[index: string]: string}} */
const LOGGER_MAP = {
  2720: 'PvGen_PvW',
  7000: 'Metering_TotWhOut',
  7020: 'Metering_TotWhOut_Daily',
  7040: 'Metering_GridMs_TotWhIn',
  7060: 'Metering_GridMs_TotWhIn_Daily',
  7090: 'Battery_ChaStt',
  '72A0': 'BatChrg_BatChrg',
  '72B0': 'BatDsch_BatDsch'
};

/**
 * @typedef {{[index: string]: string}} Translation
 * @type {{[index: number]: Translation}}
 */
const strings = {};

/**
 * @param {string} id
 * @returns {string}
 */
function getLoggerKey(id) {
  if (id in LOGGER_MAP) return LOGGER_MAP[id];
  return id;
}

/**
 * @returns {Promise<SMASimplifiedLogger[]>}
 */
export async function fetchLoggers() {
  // Dispatch fetch requests
  /** @type {Promise<SMALogger|null>[]} */
  const dataRequests = [];
  for (const inverter of await getInverters()) dataRequests.push(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    inverter.getLogger()
  );

  // Format data
  /** @type {SMASimplifiedLogger[]} */
  const result = [];
  await allSettledHandling(
    dataRequests,
    'Failed fetching logger',
    (/** @type {SMALogger} */ json) => {
      result.push(
        // @ts-expect-error
        Object.fromEntries(
          Object.entries(Object.values(json.result)[0])
            .map(([key, value]) => {
              const readableKey = getLoggerKey(key);
              const [values] = Object.values(value);
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              if (PRINT_DEBUG_INFO) logChart(
                readableKey,
                /** @type {number[]} */ (
                  values
                    .filter((_, index) => index % 3 === 0)
                    .map(dataPoint => dataPoint.v)
                    .filter(dataPoint => dataPoint !== null)
                )
              );
              return [readableKey, values];
            })
        )
      );
    }
  );
  return result;
}

/**
 * @returns {Promise<SMASimplifiedValues[]>}
 */
export async function fetchValues() {
  // Dispatch fetch requests
  /** @type {Promise<SMAValues|null>[]} */
  const dataRequests = [];
  const translationRequests = [];
  const inverters = await getInverters();
  for (const [index, inverter] of inverters.entries()) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    dataRequests.push(inverter.getValues());
    if (!(index in strings)) translationRequests.push(
      inverter.getTranslations()
    );
  }

  // Save translations
  await allSettledHandling(
    translationRequests,
    'Failed fetching translation',
    (json, index) => {
      if (
        typeof json === 'object' &&
        !Array.isArray(json) &&
        json !== null
      ) strings[index] = /** @type {{[key: string]: string}} */ (json);
    }
  );

  // Format data
  /** @type {{[key: string]: unknown[]}} */// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const debugInfo = PRINT_DEBUG_INFO
    ? Object.fromEntries(
      Object.values(OBJECT_MAP)
        .sort()
        .map(key => [key, []])
    )
    : {};
  /** @type {SMASimplifiedValues[]} */
  const result = [];
  await allSettledHandling(
    dataRequests,
    'Failed fetching data',
    (/** @type {SMAValues} */json, index) => {
      if (!json.result) return;
      const filteredJson = /** @type {SMASimplifiedValues} */ (
        Object.fromEntries(
          Object.entries(Object.values(json.result)[0])
            .map(
              ([key, value]) => /** @type {[string, SMAValuesPureValue[]]} */ ([
                key,
                Object.values(value)[0]?.map(values => values.val)
              ])
            )
            .map(
              ([key, values]) => [
                OBJECT_MAP[key] ?? key,
                values.map(
                  value => Array.isArray(value) && 'tag' in (value[0] ?? {})
                    // eslint-disable-next-line no-extra-parens
                    ? (
                      index in strings
                        ? strings[index][value[0]?.tag]
                        : '#' + value[0]?.tag
                    )
                    : value
                )
              ]
            )
            .map(
              ([key, values]) => [key, values.length === 1 ? values[0] : values]
            )
        )
      );
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (PRINT_DEBUG_INFO) for (
        const key of /** @type {(keyof SMASimplifiedValues)[]} */ (
          Object.values(OBJECT_MAP)
        )
      ) debugInfo[key].push(filteredJson[key]);
      result.push(filteredJson);
    }
  );
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (PRINT_DEBUG_INFO) logTable(
    Object.entries(debugInfo)
      .filter(entry => entry[1].some(item => (item ?? null) !== null))
      .map(entry => entry.flat())
  );
  return result;
}
