import { PLANT_IP_ADDRESSES } from './config.js';
import { fetchDeviceData } from './fetcher.js';

function setIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] = value;
}

function addIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] += value;
}

function subtractIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] -= value;
}

export async function getDevices(prefetched = null) {
  const devices = prefetched ?? await fetchDeviceData();
  const result = [];
  for (const [index, device] of devices.entries()) result.push({
    address: PLANT_IP_ADDRESSES[index],
    mode: device.Operation_RunStt,
    model: device.Name_Model,
    status: device.Operation_Health,
    vendor: device.Name_Vendor
  });
  return result;
}

export async function getLiveData(prefetched = null) {
  const devices = prefetched ?? await fetchDeviceData();
  const result = {
    energy: {
      batteryCapacity: 0,
      fromBattery: 0,
      fromGrid: 0,
      fromRoof: 0,
      toBattery: 0,
      toGrid: 0
    },
    general: {
      batteryCapacityOfOriginalCapacity: null,
      batteryPercentage: null
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
    addIfNumber(result.energy, 'batteryCapacity', device.Bat_CapacRtgWh);
    addIfNumber(result.energy, 'fromBattery', device.BatDsch_BatDsch);
    setIfNumber(result.energy, 'fromGrid', device.Metering_GridMs_TotWhIn);
    addIfNumber(result.energy, 'fromRoof', device.Metering_PvGen_PvWh);
    addIfNumber(result.energy, 'toBattery', device.BatChrg_BatChrg);
    addIfNumber(result.energy, 'toGrid', device.Metering_TotWhOut);
    subtractIfNumber(result.energy, 'toGrid', device.BatChrg_BatChrg);
    setIfNumber(
      result.general,
      'batteryCapacityOfOriginalCapacity',
      device.Bat_Diag_ActlCapacNom
    );
    setIfNumber(result.general, 'batteryPercentage', device.Battery_ChaStt);
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
