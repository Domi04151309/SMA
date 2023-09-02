process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { OBJECT_MAP } from './object-map.js';
import { PRINT_DEBUG_INFO } from './config.js';
import { getAddresses } from './inverters.js';

/** @type {{[index: string]: string}} */
const LOGGER_MAP = {
  2720: 'PvGen_PvW',
  7000: 'Metering_TotWhOut',
  7040: 'Metering_GridMs_TotWhIn',
  7090: 'Battery_ChaStt'
};

/** @type {{[index: number]: string[]}} */
const strings = {};

/**
 * @param {string} url
 * @returns {Promise<any|null>}
 */
async function fetchJson(url) {
  // Catch fetch errors here because they are otherwise uncatchable.
  const response = await fetch(url).catch(() => null);
  return await response?.json();
}

/**
 * @template T
 * @param {Promise<T>[]} promises
 * @param {string} errorMessage
 * @param {(result: T, index: number) => void} lambda
 * @returns {Promise<void>}
 */
async function allSettledHandling(
  promises,
  errorMessage,
  lambda = () => null
) {
  const settled = await Promise.allSettled(promises);
  for (
    const [index, promise] of settled.entries()
  ) if (
    promise.status === 'fulfilled' && promise.value
  ) lambda(promise.value, index);
  else if (
    promise.status === 'rejected' && promise.reason
  ) console.error(
    errorMessage + ':',
    promise.reason?.message ?? promise.reason
  );
  else console.error(errorMessage);
}

/**
 * @param {string} id
 * @returns {string}
 */
function getLoggerKey(id) {
  if (id in LOGGER_MAP) return LOGGER_MAP[id];
  return id;
}

/**
 * @returns {Promise<any[]>}
 */
export async function fetchDeviceLogger() {
  // Dispatch fetch requests
  const dataRequests = [];
  for (const address of getAddresses()) dataRequests.push(fetchJson(
    'https://' + address + '/dyn/getDashLogger.json'
  ));

  // Format data
  /** @type {object[]} */
  const result = [];
  await allSettledHandling(
    dataRequests,
    'Failed fetching logger',
    json => {
      result.push(
        Object.fromEntries(
          Object.entries(Object.values(json.result)[0])
            .map(([key, value]) => [getLoggerKey(key), Object.values(value)[0]])
        )
      );
    }
  );
  return result;
}

/**
 * @returns {Promise<object[]>}
 */
export async function fetchDeviceData() {
  // Dispatch fetch requests
  const dataRequests = [];
  const translationRequests = [];
  for (const [index, address] of getAddresses().entries()) {
    dataRequests.push(fetchJson(
      'https://' + address + '/dyn/getDashValues.json'
    ));
    if (!(index in strings)) translationRequests.push(fetchJson(
      'https://' + address + '/data/l10n/de-DE.json'
    ));
  }

  // Save translations
  await allSettledHandling(
    translationRequests,
    'Failed fetching translation',
    (promise, index) => {
      strings[index] = promise;
    }
  );

  // Format data
  /** @type {{[key: string]: unknown[]}} */
  const debugInfo = PRINT_DEBUG_INFO
    ? Object.fromEntries(
      Object.keys(OBJECT_MAP)
        .sort()
        .map(key => [key, []])
    )
    : {};
  /** @type {object[]} */
  const result = [];
  await allSettledHandling(
    dataRequests,
    'Failed fetching data',
    (json, index) => {
      const filteredJson = Object.fromEntries(
        Object.entries(Object.values(json.result)[0])
          .map(([key, value]) => [key, Object.values(value)[0][0].val])
          .map(
            entry => [
              entry[0],
              typeof entry[1] === 'object' &&
              entry[1] !== null
                // eslint-disable-next-line no-extra-parens
                ? (
                  index in strings
                    ? strings[index][entry[1][0].tag]
                    : '#' + entry[1][0].tag
                )
                : entry[1]
            ]
          )
      );
      const mappedJson = Object.fromEntries(
        Object.entries(OBJECT_MAP).map(
          ([key, value]) => [key, filteredJson[value.obj + '_' + value.lri]]
        )
      );
      if (PRINT_DEBUG_INFO) for (
        const [key, value] of Object.entries(mappedJson)
      ) debugInfo[key].push(value);
      result.push(mappedJson);
    }
  );
  // eslint-disable-next-line no-console
  if (PRINT_DEBUG_INFO) console.table(
    Object.fromEntries(
      Object.entries(debugInfo).filter(
        entry => entry[1].some(item => (item ?? null) !== null)
      )
    )
  );
  return result;
}

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
  originalEmitWarning.call(process, warning, ...otherArguments);
};
