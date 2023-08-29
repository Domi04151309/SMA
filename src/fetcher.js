process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
import { PLANT_IP_ADDRESSES, PRINT_DEBUG_INFO } from './config.js';
import { OBJECT_MAP } from './object-map.js';

const strings = {};

async function saveFetch(url) {
  return await fetch(url).catch(() => null);
}

async function saveJson(response) {
  return await response.json().catch(() => null);
}

function isFulfilled(promise) {
  return promise.status === 'fulfilled' && promise.value !== null;
}

async function allSettledHandling(
  promises,
  errorMessage,
  lambda = () => null
) {
  const settled = await Promise.allSettled(promises);
  for (
    const [index, promise] of settled.entries()
  ) if (isFulfilled(promise)) lambda(promise.value, index);
  else console.error(errorMessage, promise.reason);
}

export async function fetchDeviceData() {
  // Dispatch fetch requests
  const dataRequests = [];
  const translationRequests = [];
  for (const [index, address] of PLANT_IP_ADDRESSES.entries()) {
    dataRequests.push(saveFetch(
      'https://' + address + '/dyn/getDashValues.json'
    ));
    if (!(index in strings)) translationRequests.push(saveFetch(
      'https://' + address + '/data/l10n/de-DE.json'
    ));
  }

  // Convert responses to JSON
  const dataParserPromises = [];
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
  const debugInfo = PRINT_DEBUG_INFO
    ? Object.fromEntries(
      Object.keys(OBJECT_MAP)
        .sort()
        .map(key => [key, []])
    )
    : null;
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
        // eslint-disable-next-line no-undefined
        entry => entry[1].some(item => item !== undefined)
      )
    )
  );
  return result;
}
