process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
import { OBJECT_MAP } from './objectmap.js';

const IP_ADDRESS = '192.168.20.60';

export async function getData() {
  let json, response;
  try {
    response = await fetch(
      'https://' + IP_ADDRESS + '/dyn/getDashValues.json'
    );
    json = await response.json();
  } catch {
    return {
      energy: {},
      general: {},
      power: {},
      timestamp: Date.now()
    };
  }
  const filteredJson = Object.fromEntries(
    Object.entries(Object.values(json.result)[0])
      .map(([key, value]) => [key, value['9'][0].val])
      // eslint-disable-next-line no-unused-vars
      .filter(([_, value]) => typeof value === 'number')
  );
  const mappedJson = Object.fromEntries(
    Object.entries(OBJECT_MAP)
      .map(([key, value]) => [key, filteredJson[value.obj + '_' + value.lri]])
      // eslint-disable-next-line no-unused-vars, no-undefined
      .filter(([_, value]) => value !== undefined)
  );
  return {
    energy: {
      batteryCapacity: mappedJson.Bat_CapacRtgWh,
      fromGrid: mappedJson.Metering_GridMs_TotWhIn,
      fromRoof: mappedJson.Metering_PvGen_PvWh,
      toGrid: mappedJson.Metering_TotWhOut
    },
    general: {
      batteryCapacityOfOriginalCapacity: mappedJson.Bat_Diag_ActlCapacNom,
      batteryPercentage: mappedJson.Battery_ChaStt
    },
    power: {
      currentUsage: mappedJson.GridMs_TotW_Cur,
      fromBattery: mappedJson.Battery_CurrentDischarging,
      fromGrid: mappedJson.Metering_GridMs_TotWIn,
      fromRoof: mappedJson.PvGen_PvW,
      toBattery: mappedJson.Battery_CurrentCharging,
      toGrid: mappedJson.Metering_GridMs_TotWOut
    },
    timestamp: Date.now()
  };
}
