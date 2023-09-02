import { MoneySection } from '/components/money-section.js';

const energyPriceIn = document.querySelectorAll('.energy-price-in');
const energyPriceOut = document.querySelectorAll('.energy-price-out');
const dialog = document.getElementById('input-dialog');

export const PriceSection = {
  update() {
    const energyPriceInValue = parseFloat(
      localStorage.getItem('energyPriceIn') ?? '0'
    );
    const energyPriceOutValue = parseFloat(
      localStorage.getItem('energyPriceOut') ?? '0'
    );
    for (
      const element of energyPriceIn
    ) element.textContent = energyPriceInValue.toLocaleString('de');
    for (
      const element of energyPriceOut
    ) element.textContent = energyPriceOutValue.toLocaleString('de');
  }
};

/**
 * @param {string} message
 * @param {string|null} initialValue
 * @returns {Promise<string>}
 */
async function openModal(message, initialValue) {
  return await new Promise((resolve, reject) => {
    if (!(dialog instanceof HTMLDialogElement)) {
      reject(new Error('invalid layout'));
      return;
    }
    const dialogText = dialog.querySelector('p');
    const dialogInput = dialog.querySelector('input');
    const cancel = dialog.querySelector('.cancel');
    const ok = dialog.querySelector('.ok');
    if (
      dialogText === null ||
      dialogInput === null ||
      cancel === null ||
      ok === null
    ) {
      reject(new Error('invalid layout'));
      return;
    }
    dialogText.textContent = message;
    dialogInput.value = initialValue ?? '';
    const closeListener = () => {
      dialog.close();
    };
    const okListener = () => {
      dialog.close();
      cancel.removeEventListener('click', closeListener);
      ok.removeEventListener('click', okListener);
      resolve(dialogInput.value);
    };
    cancel.addEventListener('click', closeListener);
    ok.addEventListener('click', okListener);
    dialog.showModal();
    dialogInput.focus();
  });
}

document.getElementById('energy-price-in')?.addEventListener(
  'click',
  async () => {
    try {
      const input = await openModal(
        'Bitte lege einen neuen Einkaufspreis in €/kWh fest.',
        localStorage.getItem('energyPriceIn')
      );
      localStorage.setItem('energyPriceIn', input);
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
        localStorage.getItem('energyPriceOut')
      );
      localStorage.setItem('energyPriceOut', input);
      PriceSection.update();
      MoneySection.update();
    } catch {
      // Do nothing on cancel
    }
  }
);
