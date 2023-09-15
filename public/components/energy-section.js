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
const energyFromRoofUsedPercentage = energySection?.querySelector(
  '.energy-from-roof-used-percentage'
) ?? null;
const energyFromRoofUsedWithBattery = energySection?.querySelector(
  '.energy-from-roof-used-with-battery'
) ?? null;
const energyFromRoofUsedWithBatteryPercentage = energySection?.querySelector(
  '.energy-from-roof-used-with-battery-percentage'
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
      energyFromRoofUsedPercentage === null ||
      energyFromRoofUsedWithBattery === null ||
      energyFromRoofUsedWithBatteryPercentage === null ||
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
    const fromRoofUsed = json.fromRoof - json.toGrid - json.toBattery;
    energyFromRoofUsed.textContent = fromRoofUsed.toLocaleString('de');
    energyFromRoofUsedPercentage.textContent = Math.round(
      fromRoofUsed / json.fromRoof * 100
    ).toString();
    const fromRoofUsedWithBattery = json.fromRoof - json.toGrid;
    energyFromRoofUsedWithBattery.textContent = fromRoofUsedWithBattery
      .toLocaleString('de');
    energyFromRoofUsedWithBatteryPercentage.textContent = Math.round(
      fromRoofUsedWithBattery / json.fromRoof * 100
    ).toString();
    energyFromBattery.textContent = json.fromBattery.toLocaleString(
      'de'
    );
    energyFromGrid.textContent = json.fromGrid.toLocaleString('de');
    energyToBattery.textContent = json.toBattery.toLocaleString('de');
    energyToGrid.textContent = json.toGrid.toLocaleString('de');
  }
};
