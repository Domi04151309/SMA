import { MoneySection } from '/components/money-section.js';
import { Settings } from '../utils/settings.js';
import { openModal } from './settings-modal.js';

const energyPriceIn = document.querySelectorAll('.energy-price-in');
const energyPriceOut = document.querySelectorAll('.energy-price-out');

export const PriceSection = {
  update() {
    const localeOptions = {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    };
    const energyPriceInValue = parseFloat(
      Settings.getItem('energyPriceIn') ?? '0'
    );
    const energyPriceOutValue = parseFloat(
      Settings.getItem('energyPriceOut') ?? '0'
    );
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
      PriceSection.update();
      MoneySection.update();
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
      PriceSection.update();
      MoneySection.update();
    } catch {
      // Do nothing on cancel
    }
  }
);
