/**
 * @param {(import('../../inverter-session.js').InverterSession)[]} inverters
 * @param {SMASimplifiedValues[]} values
 * @returns {DevicesResponse}
 */
export function getDevices(inverters, values) {
  const knownMeters = new Set();
  /** @type {DevicesResponse} */
  const result = {
    batteries: [],
    clusters: [],
    energyMeters: [],
    inverters: []
  };
  for (const [index, device] of values.entries()) {
    result.clusters.push({ power: device.Inverter_WLim });
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
    if (!knownMeters.has(device.Energy_Meter_Add)) {
      result.energyMeters.push({
        address: device.Energy_Meter_Add,
        type: device.Metering_EnMtrTyp
      });
      knownMeters.add(device.Energy_Meter_Add);
    }
  }
  return result;
}
