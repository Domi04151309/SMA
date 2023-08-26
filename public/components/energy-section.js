const energyFromRoof = document.getElementById('energy-from-roof');
const energyFromRoofUsed = document.getElementById('energy-from-roof-used');
const energyFromGrid = document.getElementById('energy-from-grid');
const energyToGrid = document.getElementById('energy-to-grid');

export const EnergySection = {
  update(json) {
    energyFromRoof.textContent = json.energy.fromRoof
      ?.toLocaleString('de') ?? '?';
    energyFromRoofUsed.textContent = ((json.energy.fromRoof ?? 0) -
      (json.energy.toGrid ?? 0)).toLocaleString('de') ?? '?';
    energyFromGrid.textContent = json.energy.fromGrid
      ?.toLocaleString('de') ?? '?';
    energyToGrid.textContent = json.energy.toGrid
      ?.toLocaleString('de') ?? '?';
  }
};
