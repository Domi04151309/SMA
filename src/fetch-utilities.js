import process from 'node:process';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// eslint-disable-next-line sort-imports
import { PRINT_DEBUG_INFO } from './config.js';
import { toColoredString } from './logging/utilities.js';

/**
 * @template T
 * @param {string} url
 * @param {unknown|null} body
 * @returns {Promise<T|null>}
 */
export async function fetchJson(url, body = null) {
  const controller = new AbortController();
  setTimeout(() => {
    controller.abort();
  }, 6000);
  const response = await fetch(
    url,
    {
      body: body === null ? null : JSON.stringify(body),
      method: body === null ? 'GET' : 'POST',
      signal: controller.signal,
      // @ts-expect-error Workaround for Bun
      tls: { rejectUnauthorized: false }
    }
  ).catch((/** @type {unknown} */ error) => {
    // Catch fetch errors here because they are otherwise uncatchable in Node.
    console.error(
      `Fetch of ${url} failed:`,
      error instanceof Error ? error.message : error
    );
    return null;
  });
  const json = await response?.json();
  // eslint-disable-next-line no-console, @typescript-eslint/no-unnecessary-condition
  if (PRINT_DEBUG_INFO) console.log(
    `\u001B[1m${body === null ? 'GET' : 'POST'}\u001B[0m ${url
    }\n${toColoredString(body)}\n${toColoredString(json)}`
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return json ?? null;
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
    `${errorMessage}:`,
    promise.reason?.message ?? promise.reason
  );
  else console.error(errorMessage);
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
