import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { SETTINGS_FILE } from './config.js';
import { fileURLToPath } from 'node:url';

/** @type {{[key: string]: string}} */
let settings = {
  energyPriceIn: '0',
  energyPriceOut: '0'
};

const settingsFilePath = fileURLToPath(
  new URL('../' + SETTINGS_FILE, import.meta.url)
);
if (existsSync(settingsFilePath)) try {
  settings = JSON.parse(readFileSync(settingsFilePath).toString());
} catch (error) {
  console.error(
    'Failed opening settings file:',
    error instanceof Error ? error.message : error
  );
}
else writeFileSync(settingsFilePath, JSON.stringify(settings));

export const Settings = {
  get() {
    return settings;
  },
  save() {
    writeFileSync(settingsFilePath, JSON.stringify(settings));
  },
  setItem(/** @type {string} */ key, /** @type {string} */ value) {
    if (key in settings) settings[key] = value;
  }
};
