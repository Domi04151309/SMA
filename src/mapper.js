import {
  addIfNumber,
  getNowResponseTemplate,
  interpolateBatteryStateOfCharge,
  setIfNumber,
  wattHoursToWatts
} from './mapper-utils.js';
import { fetchLoggers, fetchValues } from './fetcher.js';
import { getInverters } from './inverters.js';

/**
 * @returns {Promise<DevicesResponse>}
 */
export async function getDevices() {
  const devices = await fetchValues();
  const inverters = await getInverters();
  const knownMeters = new Set();
  /** @type {DevicesResponse} */
  const result = {
    batteries: [],
    clusters: [],
    energyMeters: [],
    inverters: []
  };
  for (const [index, device] of devices.entries()) {
    result.clusters.push({ power: device.Inverter_WLim });
    result.inverters.push({
      address: inverters[index].address,
      mode: device.Operation_RunUsr ?? null,
      model: device.Name_Model,
      status: device.Operation_OpStt,
      vendor: device.Name_Vendor
    });
    if (
      device.Bat_CapacRtgWh &&
      device.Bat_Diag_ActlCapacNom &&
      device.Battery_OpStt
    ) result.batteries.push({
      capacity: device.Bat_CapacRtgWh,
      capacityOfOriginalCapacity: device.Bat_Diag_ActlCapacNom,
      status: device.Battery_OpStt,
      type: device.Bat_Typ ?? null
    });
    if (!knownMeters.has(device.Energy_Meter_Add)) {
      result.energyMeters.push({
        address: device.Energy_Meter_Add,
        type: device.Metering_EnMtrTyp
      });
      knownMeters.add(device.Energy_Meter_Add);
    }
  }
  return result;
}

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
      ? logger.BatChrg_BatChrg?.at(0)?.v
      // eslint-disable-next-line no-extra-parens
      : (
        logger.BatChrg_BatChrg
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
      ? logger.BatDsch_BatDsch?.at(0)?.v
      // eslint-disable-next-line no-extra-parens
      : (
        logger.BatDsch_BatDsch
          ? datasets[index - 1].energy.toBattery + Math.max(
            0,
            -batteryWattHourChange
          )
          : null
      )
  );
  addIfNumber(dataset.energy, 'toGrid', logger.Metering_TotWhOut[index]?.v);
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

/**
 * @param {SMASimplifiedLogger[]} loggers
 * @returns {Promise<NowResponse[]>}
 */
async function processLoggers(loggers) {
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
  ) if (dataset.power.toGrid < 0) dataset.power.toGrid = 0;
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
  console.error('"getExact" not yet implemented');
  return await constructHistory();
}

/**
 * @param {number} start
 * @param {number} end
 * @returns {Promise<DailyResponse[]>}
 */
export async function getDaily(start, end) {
  if (isNaN(start) || isNaN(end)) return [];
  console.error('"getDaily" not yet implemented');
  return await constructHistory();
}

/**
 * @returns {Promise<NowResponse>}
 */
export async function getNow() {
  const devices = await fetchValues();
  const result = getNowResponseTemplate(Date.now());
  let device = null;
  for (device of devices) {
    addIfNumber(result.energy, 'fromBattery', device.BatDsch_BatDsch);
    setIfNumber(result.energy, 'fromGrid', device.Metering_GridMs_TotWhIn);
    addIfNumber(result.energy, 'fromRoof', device.Metering_PvGen_PvWh);
    addIfNumber(result.energy, 'toBattery', device.BatChrg_BatChrg);
    setIfNumber(result.energy, 'toGrid', device.Metering_GridMs_TotWhOut);
    setIfNumber(result, 'batteryPercentage', device.Battery_ChaStt);
    addIfNumber(
      result.power,
      'fromBattery',
      device.Battery_CurrentDischarging
    );
    addIfNumber(result.power, 'currentUsage', device.GridMs_TotW_Cur);
    addIfNumber(result.power, 'currentUsage', device.Metering_GridMs_TotWIn);
    addIfNumber(result.power, 'fromGrid', device.Metering_GridMs_TotWIn);
    addIfNumber(result.power, 'fromRoof', device.PvGen_PvW);
    addIfNumber(result.power, 'toBattery', device.Battery_CurrentCharging);
    setIfNumber(result.power, 'toGrid', device.Metering_GridMs_TotWOut);
  }
  addIfNumber(
    result.power,
    'currentUsage',
    -(device?.Metering_GridMs_TotWOut ?? 0)
  );
  return result;
}
