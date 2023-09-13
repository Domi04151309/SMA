import {
  addIfNumber,
  getDailyResponseTemplate,
  getNowResponseTemplate,
  interpolateBatteryStateOfCharge,
  setIfNumber,
  wattHoursToWatts
} from './utils.js';
import { fetchLoggers } from '../fetcher.js';
import { getDevices } from './devices.js';
import { getInverters } from '../inverters.js';

/* eslint-disable complexity */
/**
 * @param {SMASimplifiedLogger} logger
 * @param {number} index
 * @param {NowResponse[]} datasets
 * @param {NowResponse} dataset
 * @param {number} batteryCapacity
 * @returns {void}
 */
function processDataSet(
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
      (logger.Metering_GridMs_TotWhIn[index]?.v ?? 0) -
        (logger.Metering_GridMs_TotWhIn[index - 1]?.v ?? 0),
      5 / 60
    );
  const wattageToGrid = index === 0
    ? 0
    : wattHoursToWatts(
      (logger.Metering_TotWhOut[index]?.v ?? 0) -
        (logger.Metering_TotWhOut[index - 1]?.v ?? 0),
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
    logger.Metering_GridMs_TotWhIn[index]?.v
  );
  addIfNumber(dataset.energy, 'fromRoof', logger.Metering_TotWhOut[index]?.v);
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
  addIfNumber(dataset.energy, 'toGrid', logger.Metering_TotWhOut[index]?.v);
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
 * @param {SMASimplifiedLogger[]} loggers
 * @returns {Promise<NowResponse[]>}
 */
async function processLoggers(loggers) {
  if (loggers.length === 0) return [];
  const datasets = loggers[0].Metering_TotWhOut.map(
    item => getNowResponseTemplate(item.t * 1000)
  );
  const devices = await getDevices();
  const batteryCapacity = (devices.batteries[0]?.capacity ?? 0) *
    (devices.batteries[0]?.capacityOfOriginalCapacity ?? 0) / 100;
  interpolateBatteryStateOfCharge(loggers);
  for (const logger of loggers) for (
    const [index, dataset] of datasets.entries()
  ) processDataSet(logger, index, datasets, dataset, batteryCapacity);
  for (
    const dataset of datasets
  ) if (
    dataset.power.toGrid < 0 || dataset.power.toGrid > 100_000
  ) dataset.power.toGrid = 0;
  return datasets;
}

/**
 * @param {SMASimplifiedLogger} logger
 * @param {number} index
 * @param {DailyResponse} dataset
 * @returns {void}
 */
function processDailyDataSet(
  logger,
  index,
  dataset
) {
  setIfNumber(
    dataset.energy,
    'fromBattery',
    logger.BatDsch_BatDsch?.at(index)?.v
  );
  setIfNumber(
    dataset.energy,
    'fromGrid',
    logger.Metering_GridMs_TotWhIn[index]?.v
  );
  addIfNumber(dataset.energy, 'fromRoof', logger.Metering_TotWhOut[index]?.v);
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
function processDailyLoggers(loggers) {
  if (loggers.length === 0) return [];
  const datasets = loggers[0].Metering_TotWhOut.map(
    item => getDailyResponseTemplate(item.t * 1000)
  );
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

/**
 * @returns {Promise<NowResponse[]>}
 */
export async function constructHistory() {
  const loggers = await fetchLoggers();
  if (loggers.length === 0) return [];
  return await processLoggers(loggers);
}

/**
 * @param {number} start
 * @param {number} end
 * @returns {Promise<NowResponse[]>}
 */
export async function getExact(start, end) {
  if (isNaN(start) || isNaN(end)) return [];
  const inverters = await getInverters();
  const loggerRequests = inverters.map(
    async item => await item.getExact(start / 1000, end / 1000)
  );
  const loggers = await Promise.all(loggerRequests);
  // @ts-expect-error
  return await processLoggers(loggers.filter(entry => entry !== null));
}

/**
 * @param {number} start
 * @param {number} end
 * @returns {Promise<DailyResponse[]>}
 */
export async function getDaily(start, end) {
  if (isNaN(start) || isNaN(end)) return [];
  const inverters = await getInverters();
  const loggerRequests = inverters.map(
    async item => await item.getDaily(start / 1000, end / 1000)
  );
  const loggers = await Promise.all(loggerRequests);
  // @ts-expect-error
  return processDailyLoggers(loggers.filter(entry => entry !== null));
}
