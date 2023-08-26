const ARROW_RIGHT = 'arrow-right';
const ARROW_TOP_RIGHT = 'arrow-top-right';
const ARROW_UP = 'arrow-up';
const ARROW_TOP_LEFT = 'arrow-top-left';
const ARROW_MINUS = 'arrow-minus';

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
      ARROW_TOP_LEFT,
      ARROW_MINUS
    ]
  ) element.classList.remove(previousDirection);
  const direction = getDirection();
  if (direction.length > 0) element.classList.add(getDirection());
}

export const PowerSection = {
  update(json) {
    house.textContent = json.power.currentUsage
      ?.toLocaleString('de') ?? '?';
    roof.textContent = json.power.fromRoof
      ?.toLocaleString('de') ?? '?';
    battery.textContent = json.power.fromBattery
      ?.toLocaleString('de') ?? '?';
    grid.textContent = json.power.toGrid > 0
      ? -json.power.toGrid?.toLocaleString('de')
      : json.power.fromGrid?.toLocaleString('de') ?? '?';
    batteryPercentage.textContent = json.general.batteryPercentage ?? '?';
    batteryHealth.textContent = json.general
      .batteryCapacityOfOriginalCapacity ?? '?';

    showArrow(
      roofToHouse,
      () => json.power.fromRoof > 0 && json.power.currentUsage > 0
        ? ARROW_TOP_RIGHT
        : ''
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
      () => {
        if (json.power.toBattery > 0) return ARROW_RIGHT;
        else if (
          json.power.fromRoof + json.power.fromBattery >
            json.power.currentUsage &&
          json.power.toGrid > 0
        ) return ARROW_MINUS;
        return '';
      }
    );
    showArrow(
      batteryToGrid,
      () => json.power.toGrid > 0 ? ARROW_RIGHT : ''
    );
  }
};
