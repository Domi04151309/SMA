import { PRINT_DEBUG_INFO } from './config.js';

/**
 * @param {unknown} json
 * @param {number} limit
 * @returns {unknown}
 */
function trimLargeObjectIfObject(json, limit = 50) {
  return typeof json === 'object' &&
    !Array.isArray(json) &&
    json !== null &&
    Object.keys(json).length > limit
    ? '{\n  ' + Object.entries(json)
      .slice(0, limit)
      .map(
        ([key, value]) => '\u001B[92m\'' + key + '\'\u001B[39m: ' + (
          typeof value === 'string'
            ? '\u001B[92m\'' + value + '\''
            : '\u001B[93m' + value.toString()
        ) + '\u001B[39m'
      )
      .join(',\n  ') + ',\n  ... ' + (Object.keys(json).length - limit) +
      ' more items\n}'
    : json;
}

/**
 * @template T
 * @param {string} url
 * @param {string|null} body
 * @returns {Promise<T|null>}
 */
export async function fetchJson(url, body = null) {
  // Catch fetch errors here because they are otherwise uncatchable.
  const response = await fetch(
    url,
    {
      body,
      method: body === null ? 'GET' : 'POST'
    }
  ).catch(() => null);
  const json = await response?.json();
  // eslint-disable-next-line no-console, @typescript-eslint/no-unnecessary-condition
  if (PRINT_DEBUG_INFO) console.log(trimLargeObjectIfObject(json));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return json;
}

/**
 * @template T
 * @param {Promise<T|null>[]} promises
 * @param {string} errorMessage
 * @param {(result: T, index: number) => void} lambda
 * @returns {Promise<void>}
 */
export async function allSettledHandling(
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
