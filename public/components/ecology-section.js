import { Settings } from '../utils/settings.js';

const energyCo2 = document.getElementById('energy-saved-co2');
const energyTrees = document.getElementById('energy-planted-trees');

/** @type {Energy|null} */
let lastEntry = null;

export const EcologySection = {
  update(/** @type {Energy|null} */ json = lastEntry) {
    if (json === null) return;
    lastEntry = json;
    if (
      energyCo2 === null ||
      energyTrees === null
    ) throw new Error('Invalid layout');
    const localeOptions = {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    };
    const energyCo2Value = Settings.getNumberItem('energyCo2');
    const energyTreesValue = Settings.getNumberItem('energyTrees');
    const co2Saved = (json.fromRoof - json.toGrid) / 1000 * energyCo2Value;
    energyCo2.textContent = co2Saved.toLocaleString('de', localeOptions);
    energyTrees.textContent = (
      co2Saved * energyTreesValue
    ).toLocaleString('de', localeOptions);
  }
};
