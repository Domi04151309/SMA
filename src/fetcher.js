process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
import { PLANT_IP_ADDRESSES, PRINT_DEBUG_INFO } from './config.js';
import { OBJECT_MAP } from './object-map.js';

const strings = {};

async function saveFetch(url) {
  return await fetch(url).catch(() => null);
}

async function saveJson(response) {
  return await response.json().catch(() => null);
}

function isFulfilled(promise) {
  return promise.status === 'fulfilled' && promise.value !== null;
}

function setIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] = value;
}

function addIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] += value;
}

function subtractIfNumber(object, propertyName, value) {
  if (typeof value === 'number') object[propertyName] -= value;
}

export async function fetchDeviceData() {
  // Dispatch fetch requests
  const dataRequests = [];
  const translationRequests = [];
  for (const [index, address] of PLANT_IP_ADDRESSES.entries()) {
    dataRequests.push(saveFetch(
      'https://' + address + '/dyn/getDashValues.json'
    ));
    if (!(index in strings)) translationRequests.push(saveFetch(
      'https://' + address + '/data/l10n/de-DE.json'
    ));
  }

  // Convert responses to JSON
  const dataParserPromises = [];
  const translationParserPromises = [];
  for (
    const response of await Promise.allSettled(dataRequests)
  ) if (
    isFulfilled(response)
  ) dataParserPromises.push(saveJson(response.value));
  else console.error('Failed fetching data:', response.reason);
  for (
    const response of await Promise.allSettled(translationRequests)
  ) if (
    isFulfilled(response)
  ) translationParserPromises.push(saveJson(response.value));
  else console.error('Failed fetching translation:', response.reason);

  // Save translations
  const translationParsers = await Promise.allSettled(
    translationParserPromises
  );
  for (
    const [index, json] of translationParsers.entries()
  ) if (isFulfilled(json)) strings[index] = json.value;
  else console.error('Failed fetching translation:', json.reason);

  // Format data
  const debugInfo = PRINT_DEBUG_INFO
    ? Object.fromEntries(
      Object.keys(OBJECT_MAP)
        .sort()
        .map(key => [key, []])
    )
    : null;
  let mappedJson = null;
  const dataParsers = await Promise.allSettled(dataParserPromises);
  const result = [
    ...dataParsers
      .filter(promise => {
        if (isFulfilled(promise)) return true;
        console.error('Failed parsing data:', promise.reason);
        return false;
      })
      .map(promise => promise.value)
      .entries()
  ].map(([index, json]) => {
    const filteredJson = Object.fromEntries(
      Object.entries(Object.values(json.result)[0])
        .map(([key, value]) => [key, Object.values(value)[0][0].val])
        .map(
          entry => [
            entry[0],
            typeof entry[1] === 'object' && entry[1] !== null
              ? strings[index][entry[1][0].tag]
              : entry[1]
          ]
        )
    );
    mappedJson = Object.fromEntries(
      Object.entries(OBJECT_MAP)
        .map(([key, value]) => [key, filteredJson[value.obj + '_' + value.lri]])
    );
    if (PRINT_DEBUG_INFO) for (
      const [key, value] of Object.entries(mappedJson)
    ) debugInfo[key].push(value);
    return mappedJson;
  });
  // eslint-disable-next-line no-console
  if (PRINT_DEBUG_INFO) console.table(
    Object.fromEntries(
      Object.entries(debugInfo).filter(
        // eslint-disable-next-line no-undefined
        entry => entry[1].some(item => item !== undefined)
      )
    )
  );
  return result;
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
