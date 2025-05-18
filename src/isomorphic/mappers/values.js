import {
  addIfNumber,
  getNowResponseTemplate,
  removeInvalids,
  setIfNumber
} from './utilities.js';

/**
 * @param {SMASimplifiedValues[]} values
 * @returns {NowResponse}
 */
export function getNow(values) {
  const result = getNowResponseTemplate(Date.now());
  let device = null;
  for (device of values) {
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
  addIfNumber(
    result.power,
    'currentUsage',
    -(device?.Metering_GridMs_TotWOut ?? 0)
  );
  removeInvalids(result.power);
  return result;
}
