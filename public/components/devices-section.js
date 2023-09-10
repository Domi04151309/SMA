const deviceTable = document.querySelector('#devices > table > tbody');
const rowTemplate = document.getElementsByTagName('template')[0].content;

const INVALID_LAYOUT = 'Invalid layout';

export const DevicesSection = {
  addBatteries(/** @type {DevicesResponse} */ json) {
    for (const device of json.batteries) {
      const row = rowTemplate.cloneNode(true);
      if (!(row instanceof DocumentFragment)) return;
      const icon = row.querySelector('.icon');
      const model = row.querySelector('.model');
      const mode = row.querySelector('.mode');
      const status = row.querySelector('.status');
      const link = row.querySelector('.link');
      if (
        icon === null ||
        model === null ||
        mode === null ||
        status === null ||
        link === null
      ) throw new Error(INVALID_LAYOUT);
      icon.classList.add('battery');
      model.textContent = device.type ?? 'Batterie';
      mode.textContent = device
        .capacityOfOriginalCapacity + ' % von ' + (device.capacity / 1000)
        .toLocaleString('de') + ' kWh Kapazität';
      status.textContent = device.status;
      link.remove();
      deviceTable?.append(row);
    }
  },

  addClusters(/** @type {DevicesResponse} */ json) {
    for (const device of json.clusters) {
      const row = rowTemplate.cloneNode(true);
      if (!(row instanceof DocumentFragment)) return;
      const icon = row.querySelector('.icon');
      const model = row.querySelector('.model');
      const mode = row.querySelector('.mode');
      const link = row.querySelector('.link');
      if (
        icon === null ||
        model === null ||
        mode === null ||
        link === null
      ) throw new Error(INVALID_LAYOUT);
      icon.classList.add('solar');
      model.textContent = 'Cluster';
      mode.textContent = (device.power / 1000).toLocaleString('de') +
        ' kW Maximalleistung';
      link.remove();
      deviceTable?.append(row);
    }
  },

  addEnergyMeters(/** @type {DevicesResponse} */ json) {
    for (const device of json.energyMeters) {
      const row = rowTemplate.cloneNode(true);
      if (!(row instanceof DocumentFragment)) return;
      const icon = row.querySelector('.icon');
      const model = row.querySelector('.model');
      const mode = row.querySelector('.mode');
      const link = row.querySelector('.link');
      if (
        icon === null ||
        model === null ||
        mode === null ||
        link === null
      ) throw new Error(INVALID_LAYOUT);
      icon.classList.add('energy-meter');
      model.textContent = device.type;
      mode.textContent = device.address.toString();
      link.remove();
      deviceTable?.append(row);
    }
  },

  addInverters(/** @type {DevicesResponse} */ json) {
    for (const device of json.inverters) {
      const row = rowTemplate.cloneNode(true);
      if (!(row instanceof DocumentFragment)) throw new Error(INVALID_LAYOUT);
      const model = row.querySelector('.model');
      const mode = row.querySelector('.mode');
      const status = row.querySelector('.status');
      const link = row.querySelector('.link');
      if (
        model === null ||
        mode === null ||
        status === null ||
        link === null ||
        !(link instanceof HTMLAnchorElement)
      ) throw new Error(INVALID_LAYOUT);
      model.textContent = device.vendor + ' ' + device.model;
      mode.textContent = device.mode ?? '-';
      status.textContent = device.status;
      link.href = 'https://' + device.address + '/';
      deviceTable?.append(row);
    }
  },

  update(/** @type {DevicesResponse} */ json) {
    while (
      (deviceTable?.childNodes.length ?? 0) > 1
    ) deviceTable?.lastChild?.remove();
    this.addClusters(json);
    this.addInverters(json);
    this.addBatteries(json);
    this.addEnergyMeters(json);
  }
};
