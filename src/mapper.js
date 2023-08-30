import { INVERTER_IP_ADDRESSES } from './config.js';
import { fetchDeviceData } from './fetcher.js';

/**
 * @param {{[key: string]: unknown}} object
 * @param {string} propertyName
 * @param {unknown} value
 * @returns {void}
 */
function setIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] = value;
}

/**
 * @param {{[key: string]: number}} object
 * @param {string} propertyName
 * @param {unknown} value
 * @returns {void}
 */
function addIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] += value;
}

/**
 * @param {{[key: string]: number}} object
 * @param {string} propertyName
 * @param {unknown} value
 * @returns {void}
 */
function subtractIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] -= value;
}

/**
 * @param {any[]|null} prefetched
 * @returns {Promise<DevicesResponse>}
 */
export async function getDevices(prefetched = null) {
  const devices = prefetched ?? await fetchDeviceData();
  /** @type {DevicesResponse} */
  const result = {
    batteries: [],
    energyMeters: [],
    inverters: []
  };
  for (const [index, device] of devices.entries()) {
    result.inverters.push({
      address: INVERTER_IP_ADDRESSES[index],
      mode: device.Operation_RunStt,
      model: device.Name_Model,
      status: device.Operation_Health,
      vendor: device.Name_Vendor
    });
    if (device.Bat_CapacRtgWh) result.batteries.push({
      capacity: device.Bat_CapacRtgWh,
      capacityOfOriginalCapacity: device.Bat_Diag_ActlCapacNom
    });
    if (
      device.Energy_Meter_Add &&
      !result.energyMeters.includes(device.Energy_Meter_Add)
    ) result.energyMeters.push(device.Energy_Meter_Add);
  }
  return result;
}

/**
 * @param {any[]|null} prefetched
 * @returns {Promise<NowResponse>}
 */
export async function getLiveData(prefetched = null) {
  const devices = prefetched ?? await fetchDeviceData();
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
    addIfNumber(result.energy, 'toGrid', device.Metering_TotWhOut);
    subtractIfNumber(result.energy, 'toGrid', device.BatChrg_BatChrg);
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
