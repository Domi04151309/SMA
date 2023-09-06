const energyFromRoof = document.getElementById('energy-from-roof');
const energyUsed = document.getElementById('energy-used');
const energyFromRoofUsed = document.getElementById('energy-from-roof-used');
const energyFromRoofUsedWithBattery = document.getElementById(
  'energy-from-roof-used-with-battery'
);
const energyFromBattery = document.getElementById('energy-from-battery');
const energyFromGrid = document.getElementById('energy-from-grid');
const energyToBattery = document.getElementById('energy-to-battery');
const energyToGrid = document.getElementById('energy-to-grid');

export const EnergySection = {
  update(/** @type {NowResponse} */ json) {
    if (
      energyFromRoof === null ||
      energyUsed === null ||
      energyFromRoofUsed === null ||
      energyFromRoofUsedWithBattery === null ||
      energyFromBattery === null ||
      energyFromGrid === null ||
      energyToBattery === null ||
      energyToGrid === null
    ) throw new Error('Invalid layout');
    energyFromRoof.textContent = json.energy.fromRoof.toLocaleString('de');
    energyUsed.textContent = (
      json.energy.fromRoof - json.energy.toGrid - json.energy.toBattery +
      json.energy.fromBattery + json.energy.fromGrid
    ).toLocaleString('de');
    energyFromRoofUsed.textContent = (
      json.energy.fromRoof - json.energy.toGrid - json.energy.toBattery
    ).toLocaleString('de');
    energyFromRoofUsedWithBattery.textContent = (
      json.energy.fromRoof - json.energy.toGrid
    ).toLocaleString('de');
    energyFromBattery.textContent = json.energy.fromBattery.toLocaleString(
      'de'
    );
    energyFromGrid.textContent = json.energy.fromGrid.toLocaleString('de');
    energyToBattery.textContent = json.energy.toBattery.toLocaleString('de');
    energyToGrid.textContent = json.energy.toGrid.toLocaleString('de');
  }
};
