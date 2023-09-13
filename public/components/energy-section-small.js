const energySection = document.querySelector('.small-energy-section');
const energyFromRoof = energySection?.querySelector(
  '.energy-from-roof'
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

export const EnergySectionSmall = {
  hide() {
    if (
      energySection !== null && energySection instanceof HTMLElement
    ) energySection.style.display = 'none';
  },
  update(/** @type {Energy} */ json) {
    if (
      energySection === null ||
      energyFromRoof === null ||
      energyFromBattery === null ||
      energyFromGrid === null ||
      energyToBattery === null ||
      !(energySection instanceof HTMLElement)
    ) throw new Error('Invalid layout');
    energySection.style.display = '';
    energyFromRoof.textContent = json.fromRoof.toLocaleString('de');
    energyFromBattery.textContent = json.fromBattery.toLocaleString(
      'de'
    );
    energyFromGrid.textContent = json.fromGrid.toLocaleString('de');
    energyToBattery.textContent = json.toBattery.toLocaleString('de');
  }
};
