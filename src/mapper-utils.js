/**
 * @template T
 * @param {{[K in keyof T]: any}} object
 * @param {keyof T} propertyName
 * @param {unknown} value
 * @returns {void}
 */
export function setIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] = Math.round(value);
}

/**
 * @template T
 * @param {{[K in keyof T]: any}} object
 * @param {keyof T} propertyName
 * @param {unknown} value
 * @returns {void}
 */
export function addIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] += Math.round(value);
}

/**
 * @param {number|undefined} wattHours
 * @param {number} hours
 * @returns {number}
 */
export function wattHoursToWatts(wattHours, hours) {
  if (!wattHours) return 0;
  return wattHours / hours;
}

/**
 * @param {number} timestamp
 * @returns {NowResponse}
 */
export function getNowResponseTemplate(timestamp) {
  return {
    batteryPercentage: null,
    energy: {
      fromBattery: 0,
      fromGrid: 0,
      fromRoof: 0,
      toBattery: 0,
      toGrid: 0
    },
    power: {
      currentUsage: 0,
      fromBattery: 0,
      fromGrid: 0,
      fromRoof: 0,
      toBattery: 0,
      toGrid: 0
    },
    timestamp
  };
}

/**
 * @param {SMASimplifiedLogger[]} loggers
 * @returns {void}
 */
export function interpolateBatteryStateOfCharge(loggers) {
  for (const logger of loggers) if (logger.Battery_ChaStt) {
    const states = [[0, logger.Battery_ChaStt.length - 1]];
    for (
      let index = 1; index < logger.Battery_ChaStt.length - 1; index++
    ) if (
      logger.Battery_ChaStt[index].v !== logger.Battery_ChaStt[index - 1].v
    ) {
      (states.at(-1) ?? [])[1] = index;
      states.push([index, logger.Battery_ChaStt.length - 1]);
    }
    for (const [start, end] of states) {
      const stepSize = (
        (logger.Battery_ChaStt[end].v ?? 0) -
          (logger.Battery_ChaStt[start].v ?? 0)
      ) / (end - start);
      for (
        let index = start; index < end; index++
        // eslint-disable-next-line id-length
      ) logger.Battery_ChaStt[index].v = (logger.Battery_ChaStt[start].v ?? 0) +
        stepSize * (index - start);
    }
  }
}
