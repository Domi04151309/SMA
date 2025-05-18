/**
 * @template T
 * @param {import('../inverter-session.js').InverterSession[]} inverters
 * @param {(item: import('../inverter-session.js').InverterSession) => Promise<T|null>} mapper
 * @returns {Promise<T[]>}
 */
async function fetchMultiple(inverters, mapper) {
  const requests = inverters.map(mapper);
  const responses = await Promise.all(requests);
  return /** @type {T[]} */ (
    responses.filter(response => response !== null)
  );
}

/**
 * @param {import('../inverter-session.js').InverterSession[]} inverters
 * @returns {Promise<SMASimplifiedValues[]>}
 */
export async function fetchValues(inverters) {
  return await fetchMultiple(inverters, async item => await item.getValues());
}

/**
 * @param {import('../inverter-session.js').InverterSession[]} inverters
 * @returns {Promise<SMASimplifiedLogger[]>}
 */
export async function fetchDashLoggers(inverters) {
  return await fetchMultiple(inverters, async item => await item.getLogger());
}

/**
 * @param {import('../inverter-session.js').InverterSession[]} inverters
 * @param {number} start
 * @param {number} end
 * @returns {Promise<SMASimplifiedLogger[]>}
 */
export async function fetchExactLoggers(inverters, start, end) {
  if (Number.isNaN(start) || Number.isNaN(end)) return [];
  return await fetchMultiple(
    inverters,
    async item => await item.getExact(start / 1000, end / 1000)
  );
}

/**
 * @param {import('../inverter-session.js').InverterSession[]} inverters
 * @param {number} start
 * @param {number} end
 * @returns {Promise<SMASimplifiedLogger[]>}
 */
export async function fetchDailyLoggers(inverters, start, end) {
  if (Number.isNaN(start) || Number.isNaN(end)) return [];
  return await fetchMultiple(
    inverters,
    async item => await item.getDaily(start / 1000, end / 1000)
  );
}
