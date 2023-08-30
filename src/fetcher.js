process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { INVERTER_IP_ADDRESSES, PRINT_DEBUG_INFO } from './config.js';
import { OBJECT_MAP } from './object-map.js';

/** @type {{[index: number]: string[]}} */
const strings = {};

/**
 * @param {string} url
 * @returns {Promise<Response|null>}
 */
async function saveFetch(url) {
  return await fetch(url).catch(() => null);
}

/**
 * @param {Response|null} response
 * @returns {Promise<any|null>}
 */
async function saveJson(response) {
  return await response?.json()?.catch(() => null) ?? null;
}

/**
 * @template T
 * @param {PromiseSettledResult<T>} promise
 * @returns {boolean}
 */
function isFulfilled(promise) {
  return promise.status === 'fulfilled' && promise.value !== null;
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
    // @ts-expect-error
  ) if (isFulfilled(promise)) lambda(promise.value, index);
  // @ts-expect-error
  else console.error(errorMessage, promise.reason);
}

/**
 * @returns {Promise<any[]>}
 */
export async function fetchDeviceData() {
  // Dispatch fetch requests
  const dataRequests = [];
  const translationRequests = [];
  for (const [index, address] of INVERTER_IP_ADDRESSES.entries()) {
    dataRequests.push(saveFetch(
      'https://' + address + '/dyn/getDashValues.json'
    ));
    if (!(index in strings)) translationRequests.push(saveFetch(
      'https://' + address + '/data/l10n/de-DE.json'
    ));
  }

  // Convert responses to JSON
  /** @type {Promise<any>[]} */
  const dataParserPromises = [];
  /** @type {Promise<any>[]} */
  const translationParserPromises = [];
  await allSettledHandling(
    dataRequests,
    'Failed fetching data',
    promise => dataParserPromises.push(saveJson(promise))
  );
  await allSettledHandling(
    translationRequests,
    'Failed fetching translation',
    promise => translationParserPromises.push(saveJson(promise))
  );

  // Save translations
  await allSettledHandling(
    translationParserPromises,
    'Failed parsing translation',
    (promise, index) => {
      strings[index] = promise;
    }
  );

  // Format data
  /** @type {any} */
  const debugInfo = PRINT_DEBUG_INFO
    ? Object.fromEntries(
      Object.keys(OBJECT_MAP)
        .sort()
        .map(key => [key, []])
    )
    : {};
  /** @type {any[]} */
  const result = [];
  await allSettledHandling(
    dataParserPromises,
    'Failed parsing data',
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
        entry => entry[1].some(
          (/** @type {unknown} */ item) => (item ?? null) !== null
        )
      )
    )
  );
  return result;
}
