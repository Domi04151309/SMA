const deviceTable = document.querySelector('#devices > table > tbody');
const rowTemplate = document.querySelector('#devices > template').content;

export const Devices = {
  update(json) {
    while (deviceTable.childNodes.length > 1) deviceTable.lastChild.remove();
    for (const device of json) {
      const row = rowTemplate.cloneNode(true);
      row.querySelector('.vendor').textContent = device.vendor;
      row.querySelector('.model').textContent = device.model;
      row.querySelector('.mode').textContent = device.mode;
      row.querySelector('.status').textContent = device.status;
      row.querySelector('.link').href = 'https://' + device.address + '/';
      deviceTable.append(row);
    }
  }
};
