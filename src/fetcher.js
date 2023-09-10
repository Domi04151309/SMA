process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { logChart, logTable } from './log-utils.js';
import { OBJECT_MAP } from './object-map.js';
import { PRINT_DEBUG_INFO } from './config.js';
import { allSettledHandling } from './fetch-utils.js';
import { getInverters } from './inverters.js';

/** @type {{[index: string]: string}} */
const LOGGER_MAP = {
  2720: 'PvGen_PvW',
  7000: 'Metering_GridMs_TotWhOut',
  7040: 'Metering_GridMs_TotWhIn',
  7090: 'Battery_ChaStt'
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
export async function fetchDeviceLogger() {
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
                values
                  .filter((_, index) => index % 3 === 0)
                  .map(dataPoint => dataPoint.v)
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
export async function fetchDeviceValues() {
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
      Object.keys(OBJECT_MAP)
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
      const filteredJson = Object.fromEntries(
        Object.entries(Object.values(json.result)[0])
          .map(([key, value]) => [key, Object.values(value)[0]?.at(0)?.val])
          .map(
            entry => [
              entry[0],
              Array.isArray(entry[1]) && 'tag' in (entry[1][0] ?? {})
                // eslint-disable-next-line no-extra-parens
                ? (
                  index in strings
                    ? strings[index][entry[1][0]?.tag]
                    : '#' + entry[1][0]?.tag
                )
                : entry[1]
            ]
          )
      );
      const mappedJson = /** @type {SMASimplifiedValues} */(
        Object.fromEntries(
          Object.entries(OBJECT_MAP).map(
            ([key, value]) => [key, filteredJson[value.obj + '_' + value.lri]]
          )
        )
      );
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (PRINT_DEBUG_INFO) for (
        const [key, value] of Object.entries(mappedJson)
      ) debugInfo[key].push(value);
      result.push(mappedJson);
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

// eslint-disable-next-line @typescript-eslint/unbound-method
const originalEmitWarning = process.emitWarning;
/** @type {(warning: string | Error, ...otherArguments: any[]) => void} */
process.emitWarning = (warning, ...otherArguments) => {
  if (
    typeof warning === 'string' &&
    warning.includes('NODE_TLS_REJECT_UNAUTHORIZED')
  ) {
    process.emitWarning = originalEmitWarning;
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  originalEmitWarning.call(process, warning, ...otherArguments);
};
