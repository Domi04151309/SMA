const deviceTable = document.querySelector('#devices > table > tbody');
const rowTemplate = document.getElementsByTagName('template')[0].content;

const INVALID_LAYOUT = 'Invalid layout';

export const Devices = {
  addBatteries(/** @type {ApiDevicesResponse} */ json) {
    for (const device of json.batteries) {
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
      icon.classList.add('battery');
      model.textContent = 'Batterie';
      mode.textContent = device
        .capacityOfOriginalCapacity + ' % von ' + (device.capacity / 1000)
        .toLocaleString('de') + ' kWh Kapazität';
      link.remove();
      deviceTable?.append(row);
    }
  },

  addEnergyMeters(/** @type {ApiDevicesResponse} */ json) {
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
      model.textContent = 'Energiezähler';
      mode.textContent = device.toString();
      link.remove();
      deviceTable?.append(row);
    }
  },

  addInverters(/** @type {ApiDevicesResponse} */ json) {
    for (const device of json.inverters) {
      const row = rowTemplate.cloneNode(true);
      if (!(row instanceof DocumentFragment)) throw new Error(INVALID_LAYOUT);
      const vendor = row.querySelector('.vendor');
      const model = row.querySelector('.model');
      const mode = row.querySelector('.mode');
      const status = row.querySelector('.status');
      const link = row.querySelector('.link');
      if (
        vendor === null ||
        model === null ||
        mode === null ||
        status === null ||
        link === null ||
        !(link instanceof HTMLAnchorElement)
      ) throw new Error(INVALID_LAYOUT);
      vendor.textContent = device.vendor;
      model.textContent = device.model;
      mode.textContent = device.mode;
      status.textContent = device.status;
      link.href = 'https://' + device.address + '/';
      deviceTable?.append(row);
    }
  },

  update(/** @type {ApiDevicesResponse} */ json) {
    while (
      (deviceTable?.childNodes?.length ?? 0) > 1
    ) deviceTable?.lastChild?.remove();
    this.addInverters(json);
    this.addBatteries(json);
    this.addEnergyMeters(json);
  }
};
