const ARROW_RIGHT = 'arrow-right';
const ARROW_TOP_RIGHT = 'arrow-top-right';
const ARROW_UP = 'arrow-up';
const ARROW_TOP_LEFT = 'arrow-top-left';

const house = document.querySelector('#house span');
const roof = document.querySelector('#roof span');
const battery = document.querySelector('#battery span');
const grid = document.querySelector('#grid span');
const roofToHouse = document.getElementById('roof-to-house');
const batteryToHouse = document.getElementById('battery-to-house');
const gridToHouse = document.getElementById('grid-to-house');
const roofToBattery = document.getElementById('roof-to-battery');
const batteryToGrid = document.getElementById('battery-to-grid');
const batteryPercentage = document.getElementById('battery-percentage');
const batteryHealth = document.getElementById('battery-health');

function showArrow(element, getDirection) {
  for (
    const previousDirection of [
      ARROW_RIGHT,
      ARROW_TOP_RIGHT,
      ARROW_UP,
      ARROW_TOP_LEFT
    ]
  ) element.classList.remove(previousDirection);
  const direction = getDirection();
  if (direction.length !== 0) element.classList.add(getDirection());
}

export const PowerSection = {
  update(json) {
    house.textContent = json.power.currentUsage ?? '?';
    roof.textContent = json.power.fromRoof ?? '?';
    battery.textContent = json.power.fromBattery ?? '?';
    grid.textContent = json.power.toGrid > 0
      ? -json.power.toGrid
      : json.power.fromGrid ?? '?';
    batteryPercentage.textContent = json.general.batteryPercentage ?? '?';
    batteryHealth.textContent = json.general
      .batteryCapacityOfOriginalCapacity ?? '?';

    showArrow(
      roofToHouse,
      () => json.power.fromRoof > 0 ? ARROW_TOP_RIGHT : ''
    );
    showArrow(
      batteryToHouse,
      () => json.power.fromBattery > 0 ? ARROW_UP : ''
    );
    showArrow(
      gridToHouse,
      () => json.power.fromGrid > 0 ? ARROW_TOP_LEFT : ''
    );
    showArrow(
      roofToBattery,
      () => json.power.toBattery > 0 ? ARROW_RIGHT : ''
    );
    showArrow(
      batteryToGrid,
      () => json.power.toGrid > 0 ? ARROW_RIGHT : ''
    );
  }
};
