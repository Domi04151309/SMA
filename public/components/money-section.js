const energyCostIn = document.getElementById('energy-cost-in');
const energySavedCostIn = document.getElementById('energy-saved-cost-in');
const energyCostOut = document.getElementById('energy-cost-out');

export const MoneySection = {
  update(/** @type {NowResponse} */ json) {
    if (
      energyCostIn === null ||
      energySavedCostIn === null ||
      energyCostOut === null
    ) throw new Error('Invalid layout');
    const localeOptions = {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    };
    const energyPriceInValue = parseFloat(
      localStorage.getItem('energyPriceIn') ?? '0'
    );
    const energyPriceOutValue = parseFloat(
      localStorage.getItem('energyPriceOut') ?? '0'
    );
    energyCostIn.textContent = (
      json.energy.fromGrid / 1000 * energyPriceInValue
    ).toLocaleString('de', localeOptions);
    energySavedCostIn.textContent = (
      json.energy.fromRoof / 1000 * energyPriceInValue
    ).toLocaleString('de', localeOptions);
    energyCostOut.textContent = (
      json.energy.toGrid / 1000 * energyPriceOutValue
    ).toLocaleString('de', localeOptions);
  }
};
