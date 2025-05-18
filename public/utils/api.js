import { Settings } from '/utils/settings.js';

const API_URL = '/api';

/**
 * @param {string} apiEndpoint
 * @param {(json: any) => Promise<void>|void} onSuccess
 * @param {(() => Promise<void>|void)|null} onError
 * @returns {Promise<void>}
 */
export async function fetchApiData(apiEndpoint, onSuccess, onError = null) {
  try {
    const response = await fetch(API_URL + apiEndpoint);
    if (
      onSuccess.constructor.name === 'AsyncFunction'
    ) await onSuccess(await response.json());
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    else onSuccess(await response.json());
  } catch (error) {
    console.warn(
      'Failed loading',
      `${API_URL + apiEndpoint}:`,
      error instanceof Error ? error.message : error
    );
    if (onError === null) return;
    if (onError.constructor.name === 'AsyncFunction') await onError();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    else onError();
  }
}

/**
 * @param {(json: any) => Promise<void>|void} onSuccess
 * @param {(() => Promise<void>|void)|null} onError
 * @returns {Promise<void>}
 */
export async function fetchWeatherData(onSuccess, onError = null) {
  const requestLocation = Settings.getItem('location') ?? null;
  const location = requestLocation === null
    ? ''
    : `?location=${encodeURIComponent(requestLocation)}`;

  await fetchApiData(
    `/weather${location}`,
    async json => {
      if ((Settings.getItem('location') ?? '').length === 0) Settings.setItem(
        'location',
        [
          json.nearest_area[0].latitude,
          json.nearest_area[0].longitude
        ].join(', ')
      );
      if (
        onSuccess.constructor.name === 'AsyncFunction'
      ) await onSuccess(json);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      else onSuccess(json);
    },
    onError
  );
}
