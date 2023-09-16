import { EconomySection } from '/components/economy-section.js';
import { Settings } from '../utils/settings.js';
import { openModal } from './settings-modal.js';

const energyPriceIn = document.querySelectorAll('.energy-price-in');
const energyPriceOut = document.querySelectorAll('.energy-price-out');

export const EconomySettings = {
  update() {
    const localeOptions = {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    };
    const energyPriceInValue = Settings.getNumberItem('energyPriceIn');
    const energyPriceOutValue = Settings.getNumberItem('energyPriceOut');
    for (
      const element of energyPriceIn
    ) element.textContent = energyPriceInValue.toLocaleString(
      'de',
      localeOptions
    );
    for (
      const element of energyPriceOut
    ) element.textContent = energyPriceOutValue.toLocaleString(
      'de',
      localeOptions
    );
  }
};

document.getElementById('energy-price-in')?.addEventListener(
  'click',
  async () => {
    try {
      const input = await openModal(
        'Bitte lege einen neuen Einkaufspreis in €/kWh fest.',
        Settings.getItem('energyPriceIn')
      );
      Settings.setItem('energyPriceIn', input);
      EconomySettings.update();
      EconomySection.update();
    } catch {
      // Do nothing on cancel
    }
  }
);

document.getElementById('energy-price-out')?.addEventListener(
  'click',
  async () => {
    try {
      const input = await openModal(
        'Bitte lege einen neuen Verkaufspreis in €/kWh fest.',
        Settings.getItem('energyPriceOut')
      );
      Settings.setItem('energyPriceOut', input);
      EconomySettings.update();
      EconomySection.update();
    } catch {
      // Do nothing on cancel
    }
  }
);
