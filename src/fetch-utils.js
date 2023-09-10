import { PRINT_DEBUG_INFO } from './config.js';
import { toColoredString } from './log-utils.js';

/**
 * @template T
 * @param {string} url
 * @param {unknown|null} body
 * @returns {Promise<T|null>}
 */
export async function fetchJson(url, body = null) {
  // Catch fetch errors here because they are otherwise uncatchable.
  const response = await fetch(
    url,
    {
      body: body === null ? null : JSON.stringify(body),
      method: body === null ? 'GET' : 'POST'
    }
  ).catch(() => null);
  const json = await response?.json();
  // eslint-disable-next-line no-console, @typescript-eslint/no-unnecessary-condition
  if (PRINT_DEBUG_INFO) console.log(
    '\u001B[1m' + (body === null ? 'GET' : 'POST') + '\u001B[0m ' + url +
      '\n' + toColoredString(body) + '\n' + toColoredString(json)
  );
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
