import {
  addIfNumber,
  getDailyResponseTemplate,
  getNowResponseTemplate,
  interpolateBatteryStateOfCharge,
  removeInvalids,
  setIfNumber,
  wattHoursToWatts
} from './utils.js';

/* eslint-disable complexity */
/**
 * @param {SMASimplifiedLogger} logger
 * @param {number} index
 * @param {NowResponse[]} datasets
 * @param {NowResponse} dataset
 * @param {number} batteryCapacity
 * @returns {void}
 */
function processExactDataSet(
  logger,
  index,
  datasets,
  dataset,
  batteryCapacity
) {
  const batteryWattage = index > 0 && logger.Battery_ChaStt
    ? -wattHoursToWatts(
      (
        (logger.Battery_ChaStt[index]?.v ?? 0) -
          (logger.Battery_ChaStt[index - 1]?.v ?? 0)
      ) / 100 * batteryCapacity,
      5 / 60
    )
    : 0;
  const batteryWattHourChange = index > 0 && logger.Battery_ChaStt
    ? -(
      (logger.Battery_ChaStt[index]?.v ?? 0) -
        (logger.Battery_ChaStt[index - 1]?.v ?? 0)
    ) / 100 * batteryCapacity
    : 0;
  const wattageFromGrid = index === 0
    ? 0
    : wattHoursToWatts(
      (logger.Metering_GridMs_TotWhIn?.at(index)?.v ?? 0) -
        (logger.Metering_GridMs_TotWhIn?.at(index - 1)?.v ?? 0),
      5 / 60
    );
  const wattageToGrid = index === 0
    ? 0
    : wattHoursToWatts(
      (logger.Metering_TotWhOut?.at(index)?.v ?? 0) -
        (logger.Metering_TotWhOut?.at(index - 1)?.v ?? 0),
      5 / 60
    );
  setIfNumber(
    dataset,
    'batteryPercentage',
    logger.Battery_ChaStt?.at(index)?.v
  );
  setIfNumber(
    dataset.energy,
    'fromBattery',
    index === 0
      ? logger.BatDsch_BatDsch?.at(0)?.v
      // eslint-disable-next-line no-extra-parens
      : (
        logger.BatDsch_BatDsch
          ? datasets[index - 1].energy.fromBattery + Math.max(
            0,
            batteryWattHourChange
          )
          : null
      )
  );
  setIfNumber(
    dataset.energy,
    'fromGrid',
    logger.Metering_GridMs_TotWhIn?.at(index)?.v
  );
  addIfNumber(
    dataset.energy,
    'fromRoof',
    logger.Metering_TotWhOut?.at(index)?.v
  );
  setIfNumber(
    dataset.energy,
    'toBattery',
    index === 0
      ? logger.BatChrg_BatChrg?.at(0)?.v
      // eslint-disable-next-line no-extra-parens
      : (
        logger.BatChrg_BatChrg
          ? datasets[index - 1].energy.toBattery + Math.max(
            0,
            -batteryWattHourChange
          )
          : null
      )
  );
  addIfNumber(dataset.energy, 'toGrid', logger.Metering_TotWhOut?.at(index)?.v);
  if (
    logger.BatChrg_BatChrg
  ) addIfNumber(dataset.energy, 'toGrid', -dataset.energy.toBattery);
  addIfNumber(dataset.power, 'fromBattery', Math.max(batteryWattage, 0));
  setIfNumber(dataset.power, 'fromGrid', wattageFromGrid);
  if (logger.PvGen_PvW) addIfNumber(
    dataset.power,
    'fromRoof',
    logger.PvGen_PvW.at(index)?.v
  );
  else addIfNumber(dataset.power, 'fromRoof', wattageToGrid);
  addIfNumber(dataset.power, 'toBattery', Math.max(-batteryWattage, 0));
  addIfNumber(dataset.power, 'toGrid', wattageToGrid);
  addIfNumber(dataset.power, 'toGrid', -Math.max(batteryWattage, 0));
}
/* eslint-enable complexity */

/**
 * @param {Battery|undefined} battery
 * @param {SMASimplifiedLogger[]} loggers
 * @returns {NowResponse[]}
 */
export function processExactLoggers(battery, loggers) {
  if (loggers.length === 0) return [];
  const datasets = loggers[0].Metering_TotWhOut?.map(
    item => getNowResponseTemplate(item.t * 1000)
  ) ?? null;
  if (datasets === null) return [];
  const batteryCapacity = (battery?.capacity ?? 0) *
    (battery?.capacityOfOriginalCapacity ?? 0) / 100;
  interpolateBatteryStateOfCharge(loggers);
  for (const logger of loggers) for (
    const [index, dataset] of datasets.entries()
  ) processExactDataSet(logger, index, datasets, dataset, batteryCapacity);
  for (const dataset of datasets) removeInvalids(dataset.power);
  return datasets;
}

/**
 * @param {SMASimplifiedLogger} logger
 * @param {number} index
 * @param {DailyResponse} dataset
 * @returns {void}
 */
function processDailyDataSet(logger, index, dataset) {
  setIfNumber(
    dataset.energy,
    'fromBattery',
    logger.BatDsch_BatDsch?.at(index)?.v
  );
  setIfNumber(
    dataset.energy,
    'fromGrid',
    logger.Metering_GridMs_TotWhIn?.at(index)?.v
  );
  addIfNumber(
    dataset.energy,
    'fromRoof',
    logger.Metering_TotWhOut?.at(index)?.v
  );
  setIfNumber(
    dataset.energy,
    'toBattery',
    logger.BatChrg_BatChrg?.at(index)?.v
  );
  setIfNumber(
    dataset.energy,
    'toGrid',
    logger.Metering_GridMs_TotWhOut?.at(index)?.v
  );
}

/**
 * @param {SMASimplifiedLogger[]} loggers
 * @returns {DailyResponse[]}
 */
export function processDailyLoggers(loggers) {
  if (loggers.length === 0) return [];
  const datasets = loggers[0].Metering_TotWhOut?.map(
    item => getDailyResponseTemplate(item.t * 1000)
  ) ?? null;
  if (datasets === null) return [];
  for (const logger of loggers) for (
    const [index, dataset] of datasets.entries()
  ) processDailyDataSet(logger, index, dataset);
  for (
    let index = 0; index < datasets.length; index++
  ) for (
    const key of /** @type {(keyof Energy)[]} */ (
      Object.keys(datasets[index].energy)
    )
  ) if (
    index > 0 && datasets[index].energy[key] === 0
  ) datasets[index].energy[key] = datasets[index - 1].energy[key];
  return datasets;
}
