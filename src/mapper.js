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
  if (typeof value === 'number') object[propertyName] = value;
}

/**
 * @template T
 * @param {{[K in keyof T]: any}} object
 * @param {keyof T} propertyName
 * @param {number|undefined} value
 * @returns {void}
 */
function addIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] += value;
}

/**
 * @template T
 * @param {{[K in keyof T]: any}} object
 * @param {keyof T} propertyName
 * @param {number|undefined} value
 * @returns {void}
 */
function subtractIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] -= value;
}

/**
 * @param {SMASimplifiedValues[]|null} prefetched
 * @returns {Promise<DevicesResponse>}
 */
export async function getDevices(prefetched = null) {
  const devices = prefetched ?? await fetchDeviceValues();
  const inverters = await getInverters();
  /** @type {DevicesResponse} */
  const result = {
    batteries: [],
    energyMeters: [],
    inverters: []
  };
  for (const [index, device] of devices.entries()) {
    result.inverters.push({
      address: inverters[index].address,
      mode: device.Operation_RunStt,
      model: device.Name_Model,
      status: device.Operation_Health,
      vendor: device.Name_Vendor
    });
    if (
      device.Bat_CapacRtgWh &&
      device.Bat_Diag_ActlCapacNom
    ) result.batteries.push({
      capacity: device.Bat_CapacRtgWh,
      capacityOfOriginalCapacity: device.Bat_Diag_ActlCapacNom
    });
    if (
      !result.energyMeters.includes(device.Energy_Meter_Add)
    ) result.energyMeters.push(device.Energy_Meter_Add);
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
 * @returns {Promise<NowResponse[]>}
 */
export async function constructHistory() {
  const devices = await fetchDeviceLogger();
  if (devices.length === 0) return [];
  /** @type {(NowResponse)[]} */
  const datasets = devices[0].Metering_GridMs_TotWhOut.map(
    (/** @type {{t: number, v: number}} */ item) => ({
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
  for (const device of devices) for (
    const [index, dataset] of datasets.entries()
  ) {
    setIfNumber(
      dataset.energy,
      'fromGrid',
      device.Metering_GridMs_TotWhIn[index]?.v
    );
    addIfNumber(
      dataset.energy,
      'toGrid',
      device.Metering_GridMs_TotWhOut[index]?.v
    );
    setIfNumber(
      dataset,
      'batteryPercentage',
      device.Battery_ChaStt?.at(index)?.v
    );
    if (index > 0) setIfNumber(
      dataset.power,
      'fromGrid',
      wattHoursToWatts(
        device.Metering_GridMs_TotWhIn[index]?.v -
          device.Metering_GridMs_TotWhIn[index - 1]?.v,
        5 / 60
      )
    );
    addIfNumber(dataset.power, 'fromRoof', device.PvGen_PvW?.at(index)?.v);
    if (index > 0) addIfNumber(
      dataset.power,
      'toGrid',
      wattHoursToWatts(
        device.Metering_GridMs_TotWhOut[index]?.v -
          device.Metering_GridMs_TotWhOut[index - 1]?.v,
        5 / 60
      )
    );
  }
  return datasets;
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
