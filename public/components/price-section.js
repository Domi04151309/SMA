const energyPriceIn = document.querySelectorAll('.energy-price-in');
const energyPriceOut = document.querySelectorAll('.energy-price-out');

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
 * @returns {Promise<string>}
 */
async function openModal(message) {
  return await new Promise((resolve, reject) => {
    const value = prompt(message);
    if (value === null) {
      reject(new Error('no input'));
      return;
    }
    resolve(message);
  });
}

document.getElementById('energy-price-in')?.addEventListener(
  'click',
  async () => {
    try {
      const input = await openModal(
        'Bitte lege einen neuen Einkaufspreis in €/kWh fest.'
      );
      localStorage.setItem('energyPriceIn', input);
      PriceSection.update();
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
        'Bitte lege einen neuen Verkaufspreis in €/kWh fest.'
      );
      localStorage.setItem('energyPriceOut', input);
      PriceSection.update();
    } catch {
      // Do nothing on cancel
    }
  }
);
