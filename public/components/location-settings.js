import { Settings } from '../utils/settings.js';
import { openModal } from './settings-modal.js';

const weatherLocation = document.querySelectorAll('.weather-location');

export const LocationSettings = {
  update() {
    const location = Settings.getItem('location') ?? '';
    for (const element of weatherLocation) element.textContent = location;
  }
};

document.getElementById('weather-location')?.addEventListener(
  'click',
  async () => {
    try {
      const input = await openModal(
        'Bitte lege einen neuen Standort fest.',
        Settings.getItem('location')
      );
      Settings.setItem('location', input);
      LocationSettings.update();
    } catch {
      // Do nothing on cancel
    }
  }
);
