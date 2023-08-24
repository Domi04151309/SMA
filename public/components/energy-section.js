const energyFromRoof = document.getElementById('energy-from-roof');
const energyFromGrid = document.getElementById('energy-from-grid');
const energyToGrid = document.getElementById('energy-to-grid');

export const EnergySection = {
  update(json) {
    energyFromRoof.textContent = json.energy.fromRoof ?? '?';
    energyFromGrid.textContent = json.energy.fromGrid ?? '?';
    energyToGrid.textContent = json.energy.ToGrid ?? '?';
  }
};
