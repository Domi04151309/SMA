/**
 * @template T
 * @param {{[K in keyof T]: unknown }} object
 * @param {keyof T} propertyName
 * @param {unknown} value
 * @returns {void}
 */
export function setIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] = Math.round(value);
}

/**
 * @template T
 * @param {{[K in keyof T]: unknown}} object
 * @param {keyof T} propertyName
 * @param {unknown} value
 * @returns {void}
 */
export function addIfNumber(object, propertyName, value) {
  if (typeof value === 'number') {
    const initialValue = object[propertyName];
    object[propertyName] = (
      typeof initialValue === 'number' ? initialValue : 0
    ) + Math.round(value);
  }
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
 * @param {Power} dataset
 * @returns {void}
 */
export function removeInvalids(dataset) {
  for (
    const key of /** @type {(keyof Power)[]} */ (Object.keys(dataset))
  ) if (
    dataset[key] < 0 || dataset[key] > 100_000
  ) dataset[key] = 0;
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
 * @param {number} timestamp
 * @returns {DailyResponse}
 */
export function getDailyResponseTemplate(timestamp) {
  return {
    energy: {
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
      logger.Battery_ChaStt[index].v !== null &&
      logger.Battery_ChaStt[index - 1].v !== null &&
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
