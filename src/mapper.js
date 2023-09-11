import { fetchDeviceLogger, fetchDeviceValues } from './fetcher.js';
import { getInverters } from './inverters.js';

/**
 * @template T
 * @param {{[K in keyof T]: any}} object
 * @param {keyof T} propertyName
 * @param {unknown} value
 * @returns {void}
 */
function setIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] = Math.round(value);
}

/**
 * @template T
 * @param {{[K in keyof T]: any}} object
 * @param {keyof T} propertyName
 * @param {unknown} value
 * @returns {void}
 */
function addIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] += Math.round(value);
}

/**
 * @template T
 * @param {{[K in keyof T]: any}} object
 * @param {keyof T} propertyName
 * @param {unknown} value
 * @returns {void}
 */
function subtractIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] -= Math.round(value);
}

/**
 * @param {SMASimplifiedValues[]|null} prefetched
 * @returns {Promise<DevicesResponse>}
 */
export async function getDevices(prefetched = null) {
  const devices = prefetched ?? await fetchDeviceValues();
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
    result.clusters.push({
      power: device.Inverter_WLim
    });
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
    if (
      !knownMeters.has(device.Energy_Meter_Add)
    ) {
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
 * @param {number|undefined} wattHours
 * @param {number} hours
 * @returns {number}
 */
function wattHoursToWatts(wattHours, hours) {
  if (!wattHours) return 0;
  return wattHours / hours;
}

/**
 * @param {SMASimplifiedLogger[]} loggers
 * @returns {void}
 */
function interpolateBatteryStateOfCharge(loggers) {
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

/**
 * @param {SMASimplifiedLogger} logger
 * @param {number} index
 * @param {NowResponse} dataset
 * @param {number} batteryCapacity
 * @returns {void}
 */
function processDataSet(
  logger,
  index,
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
    'fromGrid',
    logger.Metering_GridMs_TotWhIn[index]?.v
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
  subtractIfNumber(dataset.power, 'toBattery', Math.min(batteryWattage, 0));
  addIfNumber(dataset.power, 'toGrid', wattageToGrid);
  subtractIfNumber(dataset.power, 'toGrid', Math.max(batteryWattage, 0));
}

/**
 * @param {SMASimplifiedLogger[]} loggers
 * @returns {Promise<NowResponse[]>}
 */
async function processLoggers(loggers) {
  /** @type {(NowResponse)[]} */
  const datasets = loggers[0].Metering_TotWhOut.map(
    (/** @type {SMALoggerDataPoint} */ item) => ({
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
      timestamp: item.t * 1000
    })
  );
  const devices = await getDevices();
  const batteryCapacity = (devices.batteries[0]?.capacity ?? 0) *
    (devices.batteries[0]?.capacityOfOriginalCapacity ?? 0) / 100;
  interpolateBatteryStateOfCharge(loggers);
  for (const logger of loggers) for (
    const [index, dataset] of datasets.entries()
  ) processDataSet(logger, index, dataset, batteryCapacity);
  for (
    const dataset of datasets
  ) if (dataset.power.toGrid < 0) dataset.power.toGrid = 0;
  return datasets;
}

/**
 * @returns {Promise<NowResponse[]>}
 */
export async function constructHistory() {
  const loggers = await fetchDeviceLogger();
  if (loggers.length === 0) return [];
  return await processLoggers(loggers);
}

/**
 * @param {SMASimplifiedValues[]|null} prefetched
 * @returns {Promise<NowResponse>}
 */
export async function getLiveData(prefetched = null) {
  const devices = prefetched ?? await fetchDeviceValues();
  const result = {
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
    timestamp: Date.now()
  };
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
  subtractIfNumber(
    result.power,
    'currentUsage',
    device?.Metering_GridMs_TotWOut
  );
  return result;
}
