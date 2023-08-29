const deviceTable = document.querySelector('#devices > table > tbody');
const rowTemplate = document.querySelector('#devices > template').content;

export const Devices = {
  update(json) {
    while (deviceTable.childNodes.length > 1) deviceTable.lastChild.remove();
    for (const device of json.inverters) {
      const row = rowTemplate.cloneNode(true);
      row.querySelector('.vendor').textContent = device.vendor;
      row.querySelector('.model').textContent = device.model;
      row.querySelector('.mode').textContent = device.mode;
      row.querySelector('.status').textContent = device.status;
      row.querySelector('.link').href = 'https://' + device.address + '/';
      deviceTable.append(row);
    }
    for (const device of json.batteries) {
      const row = rowTemplate.cloneNode(true);
      row.querySelector('.icon').classList.add('battery');
      row.querySelector('.model').textContent = 'Batterie';
      row.querySelector('.mode').textContent = device
        .capacityOfOriginalCapacity + ' % von ' + (device.capacity / 1000)
        .toLocaleString('de') + ' kWh Kapazität';
      row.querySelector('.link').remove();
      deviceTable.append(row);
    }
    for (const device of json.energyMeters) {
      const row = rowTemplate.cloneNode(true);
      row.querySelector('.icon').classList.add('energy-meter');
      row.querySelector('.model').textContent = 'Energiezähler';
      row.querySelector('.mode').textContent = device;
      row.querySelector('.link').remove();
      deviceTable.append(row);
    }
  }
};
