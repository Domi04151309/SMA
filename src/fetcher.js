process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
import { PLANT_IP_ADDRESSES, PRINT_DEBUG_INFO } from './config.js';
import { OBJECT_MAP } from './object-map.js';

function setIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] = value;
}

function addIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] += value;
}

function subtractIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] -= value;
}

/* eslint-disable no-await-in-loop */
export async function getData() {
  const result = {
    energy: {
      batteryCapacity: 0,
      fromGrid: 0,
      fromRoof: 0,
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
  let mappedJson = null;
  for (const address of PLANT_IP_ADDRESSES) {
    let json, response;
    try {
      response = await fetch(
        'https://' + address + '/dyn/getDashValues.json'
      );
      json = await response.json();
    } catch {
      console.warn('Failed fetching data from ' + address);
      continue;
    }
    const filteredJson = Object.fromEntries(
      Object.entries(Object.values(json.result)[0])
        .map(([key, value]) => [key, Object.values(value)[0][0].val])
        .filter(pair => typeof pair[1] === 'number')
    );
    mappedJson = Object.fromEntries(
      Object.entries(OBJECT_MAP)
        .map(([key, value]) => [key, filteredJson[value.obj + '_' + value.lri]])
    );
    // eslint-disable-next-line no-console
    if (PRINT_DEBUG_INFO) console.table(
      Object.fromEntries(Object.entries(mappedJson).filter(item => item[1]))
    );
    addIfNumber(result.energy, 'batteryCapacity', mappedJson.Bat_CapacRtgWh);
    setIfNumber(result.energy, 'fromGrid', mappedJson.Metering_GridMs_TotWhIn);
    addIfNumber(result.energy, 'fromRoof', mappedJson.Metering_PvGen_PvWh);
    addIfNumber(result.energy, 'toGrid', mappedJson.Metering_TotWhOut);
    setIfNumber(
      result.general,
      'batteryCapacityOfOriginalCapacity',
      mappedJson.Bat_Diag_ActlCapacNom
    );
    setIfNumber(result.general, 'batteryPercentage', mappedJson.Battery_ChaStt);
    addIfNumber(
      result.power,
      'fromBattery',
      mappedJson.Battery_CurrentDischarging
    );
    addIfNumber(result.power, 'currentUsage', mappedJson.GridMs_TotW_Cur);
    addIfNumber(result.power, 'fromGrid', mappedJson.Metering_GridMs_TotWIn);
    addIfNumber(result.power, 'fromRoof', mappedJson.PvGen_PvW);
    addIfNumber(result.power, 'toBattery', mappedJson.Battery_CurrentCharging);
    setIfNumber(result.power, 'toGrid', mappedJson.Metering_GridMs_TotWOut);
  }
  subtractIfNumber(
    result.power,
    'currentUsage',
    mappedJson.Metering_GridMs_TotWOut
  );
  return result;
}
/* eslint-enable no-await-in-loop */
