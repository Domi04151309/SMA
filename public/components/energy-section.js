const energySection = document.querySelector('.energy-section');
const energyFromRoof = energySection?.querySelector(
  '.energy-from-roof'
) ?? null;
const energyUsed = energySection?.querySelector(
  '.energy-used'
) ?? null;
const energyFromRoofUsed = energySection?.querySelector(
  '.energy-from-roof-used'
) ?? null;
const energyFromRoofUsedWithBattery = energySection?.querySelector(
  '.energy-from-roof-used-with-battery'
) ?? null;
const energyFromBattery = energySection?.querySelector(
  '.energy-from-battery'
) ?? null;
const energyFromGrid = energySection?.querySelector(
  '.energy-from-grid'
) ?? null;
const energyToBattery = energySection?.querySelector(
  '.energy-to-battery'
) ?? null;
const energyToGrid = energySection?.querySelector(
  '.energy-to-grid'
) ?? null;

export const EnergySection = {
  update(/** @type {Energy} */ json) {
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
    energyFromRoof.textContent = json.fromRoof.toLocaleString('de');
    energyUsed.textContent = (
      json.fromRoof - json.toGrid - json.toBattery +
      json.fromBattery + json.fromGrid
    ).toLocaleString('de');
    energyFromRoofUsed.textContent = (
      json.fromRoof - json.toGrid - json.toBattery
    ).toLocaleString('de');
    energyFromRoofUsedWithBattery.textContent = (
      json.fromRoof - json.toGrid
    ).toLocaleString('de');
    energyFromBattery.textContent = json.fromBattery.toLocaleString(
      'de'
    );
    energyFromGrid.textContent = json.fromGrid.toLocaleString('de');
    energyToBattery.textContent = json.toBattery.toLocaleString('de');
    energyToGrid.textContent = json.toGrid.toLocaleString('de');
  }
};
