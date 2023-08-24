import {
  Chart
} from 'https://unpkg.com/frappe-charts@1.6.1/dist/frappe-charts.min.esm.js';

const API_URL = '/api';

const ARROW_LEFT = 'arrow-left';
const ARROW_BOTTOM_LEFT = 'arrow-bottom-left';
const ARROW_DOWN = 'arrow-down';
const ARROW_BOTTOM_RIGHT = 'arrow-bottom-right';
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
const energyFromRoof = document.getElementById('energy-from-roof');
const energyFromGrid = document.getElementById('energy-from-grid');
const energyToGrid = document.getElementById('energy-to-grid');

let historyChart = null;
let batteryChart = null;

function showArrow(element, getDirection) {
  for (
    const previousDirection of [
      ARROW_LEFT,
      ARROW_BOTTOM_LEFT,
      ARROW_DOWN,
      ARROW_BOTTOM_RIGHT,
      ARROW_RIGHT,
      ARROW_TOP_RIGHT,
      ARROW_UP,
      ARROW_TOP_LEFT
    ]
  ) element.classList.remove(previousDirection);
  const direction = getDirection();
  if (direction.length !== 0) element.classList.add(getDirection());
}

async function fetchLiveData() {
  const response = await fetch(API_URL + '/now');
  return await response.json();
}

function updateCharts(json) {
  historyChart.addDataPoint(
    new Date(json.timestamp).toLocaleTimeString(),
    [
      json.power.fromRoof ?? 0,
      json.power.fromBattery ?? 0,
      json.power.fromGrid ?? 0,
      json.power.currentUsage ?? 0
    ]
  );
  batteryChart.addDataPoint(
    new Date(json.timestamp).toLocaleTimeString(),
    [json.general.batteryPercentage ?? 0]
  );
}

async function update(data = null) {
  const json = data ?? await fetchLiveData();
  house.textContent = json.power.currentUsage ?? '?';
  roof.textContent = json.power.fromRoof ?? '?';
  battery.textContent = json.power.fromBattery ?? '?';
  grid.textContent = json.power.toGrid > 0
    ? -json.power.toGrid
    : json.power.fromGrid ?? '?';
  batteryPercentage.textContent = json.general.batteryPercentage ?? '?';
  batteryHealth.textContent = json.general.batteryCapacityOfOriginalCapacity ??
    '?';

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

  if (data === null) updateCharts(json);

  energyFromRoof.textContent = json.energy.fromRoof ?? '?';
  energyFromGrid.textContent = json.energy.fromGrid ?? '?';
  energyToGrid.textContent = json.energy.ToGrid ?? '?';
}

async function initialize() {
  const response = await fetch(API_URL + '/history');
  const json = await response.json();
  const commonChartOptions = {
    axisOptions: {
      xAxisMode: 'tick',
      xIsSeries: 1
    },
    barOptions: { stacked: 1 },
    colors: ['#651FFF', '#2979FF', '#00E5FF', '#76FF03'],
    lineOptions: { hideDots: 1 },
    type: 'axis-mixed'
  };
  historyChart = new Chart('#history-chart', {
    ...commonChartOptions,
    data: {
      datasets: [
        {
          chartType: 'bar',
          name: 'Dach',
          values: json.map(item => item.power.fromRoof ?? 0)
        },
        {
          chartType: 'bar',
          name: 'Batterie',
          values: json.map(item => item.power.fromBattery ?? 0)
        },
        {
          chartType: 'bar',
          name: 'Netz',
          values: json.map(item => item.power.fromGrid ?? 0)
        },
        {
          chartType: 'line',
          name: 'Haus',
          values: json.map(item => item.power.currentUsage ?? 0)
        }
      ],
      labels: json.map(item => new Date(item.timestamp).toLocaleTimeString())
    },
    title: 'Leistung',
    tooltipOptions: { formatTooltipY: value => value + ' W' }
  });
  batteryChart = new Chart('#battery-chart', {
    ...commonChartOptions,
    data: {
      datasets: [
        {
          chartType: 'line',
          name: 'Batterie',
          values: json.map(item => item.general.batteryPercentage ?? 0)
        }
      ],
      labels: json.map(item => new Date(item.timestamp).toLocaleTimeString())
    },
    title: 'Batterie',
    tooltipOptions: { formatTooltipY: value => value + ' %' }
  });
  await update(json.at(-1));
  setInterval(update, 10000);
}

initialize();
