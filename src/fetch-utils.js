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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await response?.json();
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
