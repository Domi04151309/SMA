try {
  const response = await fetch('/api/settings');
  const settings = await response.json();
  for (
    const [key, value] of Object.entries(settings)
  ) localStorage.setItem(key, value);
} catch {
  console.warn('Failed loading settings');
}

export const Settings = {
  getItem(/** @type {string} */ key) {
    return localStorage.getItem(key);
  },
  setItem(/** @type {string} */ key, /** @type {string} */ value) {
    localStorage.setItem(key, value);
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
