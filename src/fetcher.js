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

const strings = {};

export async function getData() {
  // Prepare result
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

  // Dispatch fetch requests
  const dataRequests = [];
  const translationRequests = [];
  for (const address of PLANT_IP_ADDRESSES) {
    dataRequests.push(fetch(
      'https://' + address + '/dyn/getDashValues.json'
    ));
    if (!(address in strings)) translationRequests.push(fetch(
      'https://' + address + '/data/l10n/de-DE.json'
    ));
  }

  // Convert responses to JSON
  const dataParserPromises = [];
  const translationParserPromises = [];
  try {
    for (
      const response of await Promise.all(dataRequests)
    ) dataParserPromises.push(response.json());
  } catch (error) {
    console.error('Failed fetching data:', error.message);
  }
  try {
    for (
      const response of await Promise.all(translationRequests)
    ) translationParserPromises.push(response.json());
  } catch (error) {
    console.error('Failed fetching translation:', error.message);
  }

  // Save translations
  try {
    const translationParsers = await Promise.all(translationParserPromises);
    for (
      const [index, json] of translationParsers.entries()
    ) strings[index] = json;
  } catch (error) {
    console.error('Failed parsing translation:', error.message);
  }

  // Format data
  const debugInfo = PRINT_DEBUG_INFO
    ? Object.fromEntries(Object.keys(OBJECT_MAP).map(key => [key, []]))
    : null;
  let mappedJson = null;
  const dataParsers = [];
  try {
    dataParsers.push(...await Promise.all(dataParserPromises));
  } catch (error) {
    console.error('Failed parsing data:', error.message);
  }
  for (const [index, json] of dataParsers.entries()) {
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
    mappedJson?.Metering_GridMs_TotWOut
  );
  // eslint-disable-next-line no-console
  if (PRINT_DEBUG_INFO) console.table(
    Object.fromEntries(
      Object.entries(debugInfo).filter(entry => entry[1].some(Boolean))
    )
  );
  return result;
}
