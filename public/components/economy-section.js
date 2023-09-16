import { Settings } from '../utils/settings.js';

const energyCostIn = document.getElementById('energy-cost-in');
const energySavedCostIn = document.getElementById('energy-saved-cost-in');
const energyCostOut = document.getElementById('energy-cost-out');

/** @type {Energy|null} */
let lastEntry = null;

export const EconomySection = {
  update(/** @type {Energy|null} */ json = lastEntry) {
    if (json === null) return;
    lastEntry = json;
    if (
      energyCostIn === null ||
      energySavedCostIn === null ||
      energyCostOut === null
    ) throw new Error('Invalid layout');
    const localeOptions = {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    };
    const energyPriceInValue = Settings.getNumberItem('energyPriceIn');
    const energyPriceOutValue = Settings.getNumberItem('energyPriceOut');
    energyCostIn.textContent = (
      json.fromGrid / 1000 * energyPriceInValue
    ).toLocaleString('de', localeOptions);
    energySavedCostIn.textContent = (
      (json.fromRoof - json.toGrid) / 1000 * energyPriceInValue
    ).toLocaleString('de', localeOptions);
    energyCostOut.textContent = (
      json.toGrid / 1000 * energyPriceOutValue
    ).toLocaleString('de', localeOptions);
  }
};
