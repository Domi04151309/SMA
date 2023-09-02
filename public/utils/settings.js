/** @type {{[key: string]: string}} */
let settings = {};

try {
  const response = await fetch('/api/settings');
  settings = await response.json();
} catch {
  console.error('Failed loading settings');
}

export const Settings = {
  getItem(/** @type {string} */ key) {
    return settings[key];
  },
  setItem(/** @type {string} */ key, /** @type {string} */ value) {
    settings[key] = value;
    (async () => {
      /** @type {{[key: string]: string}} */
      const requestBody = {};
      requestBody[key] = value;
      await fetch(
        '/api/settings',
        {
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
          method: 'PUT'
        }
      );
    })();
  }
};
