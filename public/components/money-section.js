import { Settings } from '../utils/settings.js';

const energyCostIn = document.getElementById('energy-cost-in');
const energySavedCostIn = document.getElementById('energy-saved-cost-in');
const energyCostOut = document.getElementById('energy-cost-out');

/** @type {NowResponse|null} */
let lastEntry = null;

/**
 * @param {string} key
 * @returns {number}
 */
function getNumberItem(key) {
  const result = parseFloat(Settings.getItem(key) ?? '0');
  return isNaN(result) ? 0 : result;
}

export const MoneySection = {
  update(/** @type {NowResponse|null} */ json = lastEntry) {
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
    const energyPriceInValue = getNumberItem('energyPriceIn');
    const energyPriceOutValue = getNumberItem('energyPriceOut');
    energyCostIn.textContent = (
      json.energy.fromGrid / 1000 * energyPriceInValue
    ).toLocaleString('de', localeOptions);
    energySavedCostIn.textContent = (
      (json.energy.fromRoof - json.energy.toGrid) / 1000 * energyPriceInValue
    ).toLocaleString('de', localeOptions);
    energyCostOut.textContent = (
      json.energy.toGrid / 1000 * energyPriceOutValue
    ).toLocaleString('de', localeOptions);
  }
};
