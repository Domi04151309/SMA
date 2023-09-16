import { Settings } from '../utils/settings.js';
import { openModal } from './settings-modal.js';

const energyCo2 = document.querySelectorAll('.energy-co2');
const energyTrees = document.querySelectorAll('.energy-trees');

export const EcologySettings = {
  update() {
    const localeOptions = {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    };
    const energyCo2Value = Settings.getNumberItem('energyCo2');
    const energyTreesValue = Settings.getNumberItem('energyTrees');
    for (
      const element of energyCo2
    ) element.textContent = energyCo2Value.toLocaleString(
      'de',
      localeOptions
    );
    for (
      const element of energyTrees
    ) element.textContent = energyTreesValue.toLocaleString(
      'de',
      localeOptions
    );
  }
};

document.getElementById('energy-co2')?.addEventListener(
  'click',
  async () => {
    try {
      const input = await openModal(
        'Bitte lege einen neuen Wert in kg/kWh fest.',
        Settings.getItem('energyCo2')
      );
      Settings.setItem('energyCo2', input);
      EcologySettings.update();
    } catch {
      // Do nothing on cancel
    }
  }
);

document.getElementById('energy-trees')?.addEventListener(
  'click',
  async () => {
    try {
      const input = await openModal(
        'Bitte lege eine neue Anzahl an Bäumen in Bäume/kg fest.',
        Settings.getItem('energyTrees')
      );
      Settings.setItem('energyTrees', input);
      EcologySettings.update();
    } catch {
      // Do nothing on cancel
    }
  }
);
