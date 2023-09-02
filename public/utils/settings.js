export const Settings = {
  getItem(/** @type {string} */ key) {
    return localStorage.getItem(key);
  },
  setItem(/** @type {string} */ key, /** @type {string} */ value) {
    localStorage.setItem(key, value);
  }
};
