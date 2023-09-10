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
 * @param {SMASimplifiedLogger[]} devices
 * @returns {void}
 */
function interpolateBatteryStateOfCharge(devices) {
  for (const device of devices) if (device.Battery_ChaStt) {
    const states = [[0, device.Battery_ChaStt.length - 1]];
    for (
      let index = 1; index < device.Battery_ChaStt.length - 1; index++
    ) if (
      device.Battery_ChaStt[index].v !== device.Battery_ChaStt[index - 1].v
    ) {
      (states.at(-1) ?? [])[1] = index;
      states.push([index, device.Battery_ChaStt.length - 1]);
    }
    for (const [start, end] of states) {
      const stepSize = (
        (device.Battery_ChaStt[end].v ?? 0) -
          (device.Battery_ChaStt[start].v ?? 0)
      ) / (end - start);
      for (
        let index = start; index < end; index++
        // eslint-disable-next-line id-length
      ) device.Battery_ChaStt[index].v = (device.Battery_ChaStt[start].v ?? 0) +
        stepSize * (index - start);
    }
  }
}

/**
 * @returns {Promise<NowResponse[]>}
 */
export async function constructHistory() {
  const deviceData = await getDevices();
  const batteryCapacity = (deviceData.batteries[0]?.capacity ?? 0) *
    (deviceData.batteries[0]?.capacityOfOriginalCapacity ?? 0) / 100;
  const devices = await fetchDeviceLogger();
  if (devices.length === 0) return [];
  /** @type {(NowResponse)[]} */
  const datasets = devices[0].Metering_GridMs_TotWhOut.map(
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
  interpolateBatteryStateOfCharge(devices);
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
    const wattageFromGrid = index === 0
      ? 0
      : wattHoursToWatts(
        (device.Metering_GridMs_TotWhIn[index]?.v ?? 0) -
          (device.Metering_GridMs_TotWhIn[index - 1]?.v ?? 0),
        5 / 60
      );
    const wattageToGrid = index === 0
      ? 0
      : wattHoursToWatts(
        (device.Metering_GridMs_TotWhOut[index]?.v ?? 0) -
          (device.Metering_GridMs_TotWhOut[index - 1]?.v ?? 0),
        5 / 60
      );
    if (dataset.power.currentUsage === 0) addIfNumber(
      dataset.power,
      'currentUsage',
      wattageFromGrid
    );
    if (index > 0) {
      if (device.Battery_ChaStt) {
        const batteryWattage = wattHoursToWatts(
          (
            (device.Battery_ChaStt[index]?.v ?? 0) -
              (device.Battery_ChaStt[index - 1]?.v ?? 0)
          ) / 100 * batteryCapacity,
          5 / 60
        );
        addIfNumber(
          dataset.power,
          'currentUsage',
          batteryWattage > 0 ? batteryWattage : 0
        );
        addIfNumber(
          dataset.power,
          'fromBattery',
          batteryWattage > 0 ? batteryWattage : 0
        );
        addIfNumber(
          dataset.power,
          'toBattery',
          batteryWattage < 0 ? -batteryWattage : 0
        );
      }
      setIfNumber(dataset.power, 'fromGrid', wattageFromGrid);
    }
    addIfNumber(dataset.power, 'fromRoof', device.PvGen_PvW?.at(index)?.v);
    addIfNumber(dataset.power, 'toGrid', wattageToGrid);
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
