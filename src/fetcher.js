process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
import { PLANT_IP_ADDRESSES, PRINT_DEBUG_INFO } from './config.js';
import { OBJECT_MAP } from './object-map.js';

const FULFILLED = 'fulfilled';

const strings = {};

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
    dataRequests.push(fetch(
      'https://' + address + '/dyn/getDashValues.json'
    ));
    if (!(index in strings)) translationRequests.push(fetch(
      'https://' + address + '/data/l10n/de-DE.json'
    ));
  }

  // Convert responses to JSON
  const dataParserPromises = [];
  const translationParserPromises = [];
  for (
    const response of await Promise.allSettled(dataRequests)
  ) if (
    response.status === FULFILLED
  ) dataParserPromises.push(response.value.json());
  else console.error('Failed fetching data:', response.reason);
  for (
    const response of await Promise.allSettled(translationRequests)
  ) if (
    response.status === FULFILLED
  ) translationParserPromises.push(response.value.json());
  else console.error('Failed fetching translation:', response.reason);

  // Save translations
  const translationParsers = await Promise.allSettled(
    translationParserPromises
  );
  for (
    const [index, json] of translationParsers.entries()
  ) if (
    json.status === FULFILLED
  ) strings[index] = json.value;
  else console.error('Failed fetching translation:', json.reason);

  // Format data
  const debugInfo = PRINT_DEBUG_INFO
    ? Object.fromEntries(Object.keys(OBJECT_MAP).map(key => [key, []]))
    : null;
  let mappedJson = null;
  const dataParsers = await Promise.allSettled(dataParserPromises);
  const result = [
    ...dataParsers
      .filter(promise => {
        if (promise.status === FULFILLED) return true;
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
      Object.entries(debugInfo).filter(entry => entry[1].some(Boolean))
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
  let device = null;
  for (device of devices) {
    addIfNumber(result.energy, 'batteryCapacity', device.Bat_CapacRtgWh);
    setIfNumber(result.energy, 'fromGrid', device.Metering_GridMs_TotWhIn);
    addIfNumber(result.energy, 'fromRoof', device.Metering_PvGen_PvWh);
    addIfNumber(result.energy, 'toGrid', device.Metering_TotWhOut);
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
