const sourceIcon = document.querySelector('#quick-source img');
const sourceLabel = document.querySelector('#quick-source .primary');
const weatherIcon = document.querySelector('#quick-weather img');
const weatherLabel = document.querySelector('#quick-weather .primary');
const weatherSecondaryLabel = document.querySelector(
  '#quick-weather .secondary'
);

/**
 * @returns {string}
 */
function getMatchingTime() {
  const time = new Date();
  return (
    Math.round((time.getHours() + time.getMinutes() / 100) / 3) * 300
  ).toString();
}

/**
 * @param {string|undefined} code
 * @returns {string}
 */
function getWeatherIcon(code) {
  if (!code) return 'icons8-sand-timer-96.png';
  /* eslint-disable sonarjs/no-duplicate-string */
  /** @type {{[key: string]: string}} */
  const iconMap = {

    /** Sunny */
    113: 'icons8-sunny-96.png',

    /** PartlyCloudy */
    116: 'icons8-cloudy-96.png',

    /** Cloudy */
    119: 'icons8-cloudy-96.png',

    /** VeryCloudy */
    122: 'icons8-cloudy-96.png',

    /** Fog */
    143: 'icons8-fog-96.png',

    /** LightShowers */
    176: 'icons8-rain-96.png',

    /** LightSleetShowers */
    179: 'icons8-rain-96.png',

    /** LightSleet */
    182: 'icons8-sleet-96.png',

    /** LightSleet */
    185: 'icons8-sleet-96.png',

    /** ThunderyShowers */
    200: 'icons8-thunder-96.png',

    /** LightSnow */
    227: 'icons8-snow-96.png',

    /** HeavySnow */
    230: 'icons8-snow-96.png',

    /** Fog */
    248: 'icons8-fog-96.png',

    /** Fog */
    260: 'icons8-fog-96.png',

    /** LightShowers */
    263: 'icons8-rain-96.png',

    /** LightRain */
    266: 'icons8-rain-96.png',

    /** LightSleet */
    281: 'icons8-sleet-96.png',

    /** LightSleet */
    284: 'icons8-sleet-96.png',

    /** LightRain */
    293: 'icons8-rain-96.png',

    /** LightRain */
    296: 'icons8-rain-96.png',

    /** HeavyShowers */
    299: 'icons8-rain-96.png',

    /** HeavyRain */
    302: 'icons8-rain-96.png',

    /** HeavyShowers */
    305: 'icons8-rain-96.png',

    /** HeavyRain */
    308: 'icons8-rain-96.png',

    /** LightSleet */
    311: 'icons8-sleet-96.png',

    /** LightSleet */
    314: 'icons8-sleet-96.png',

    /** LightSleet */
    317: 'icons8-sleet-96.png',

    /** LightSnow */
    320: 'icons8-snow-96.png',

    /** LightSnowShowers */
    323: 'icons8-snow-96.png',

    /** LightSnowShowers */
    326: 'icons8-snow-96.png',

    /** HeavySnow */
    329: 'icons8-snow-96.png',

    /** HeavySnow */
    332: 'icons8-snow-96.png',

    /** HeavySnowShowers */
    335: 'icons8-snow-96.png',

    /** HeavySnow */
    338: 'icons8-snow-96.png',

    /** LightSleet */
    350: 'icons8-sleet-96.png',

    /** LightShowers */
    353: 'icons8-rain-96.png',

    /** HeavyShowers */
    356: 'icons8-rain-96.png',

    /** HeavyRain */
    359: 'icons8-rain-96.png',

    /** LightSleetShowers */
    362: 'icons8-sleet-96.png',

    /** LightSleetShowers */
    365: 'icons8-sleet-96.png',

    /** LightSnowShowers */
    368: 'icons8-sleet-96.png',

    /** HeavySnowShowers */
    371: 'icons8-sleet-96.png',

    /** LightSleetShowers */
    374: 'icons8-sleet-96.png',

    /** LightSleet */
    377: 'icons8-sleet-96.png',

    /** ThunderyShowers */
    386: 'icons8-thunder-96.png',

    /** ThunderyHeavyRain */
    389: 'icons8-thunder-96.png',

    /** ThunderySnowShowers */
    392: 'icons8-thunder-96.png',

    /** HeavySnowShowers */
    395: 'icons8-sleet-96.png'
  };
  /* eslint-enable sonarjs/no-duplicate-string */
  if (code in iconMap) return iconMap[code];
  return 'icons8-sand-timer-96.png';
}

export const QuickSection = {
  updateSource(/** @type {NowResponse} */ json) {
    if (
      sourceIcon === null ||
      sourceLabel === null ||
      !(sourceIcon instanceof HTMLImageElement)
    ) throw new Error('Invalid layout');
    let [maxKey, maxValue] = ['?', -Infinity];
    for (
      const key of /** @type {(keyof Power)[]} */ (
        ['fromRoof', 'fromBattery', 'fromGrid']
      )
    ) if (json.power[key] > maxValue) [maxKey, maxValue] = [
      key,
      json.power[key]
    ];
    switch (maxKey) {
    case 'fromRoof':
      sourceIcon.src = '/images/icons8-solar-96.png';
      sourceLabel.textContent = 'Dach';
      break;
    case 'fromBattery':
      sourceIcon.src = '/images/icons8-battery-96.png';
      sourceLabel.textContent = 'Batterie';
      break;
    case 'fromGrid':
      sourceIcon.src = '/images/icons8-grid-96.png';
      sourceLabel.textContent = 'Netz';
      break;
    default:
      break;
    }
  },
  updateWeather(/** @type {WeatherResponse} */ json) {
    if (
      weatherIcon === null ||
      weatherLabel === null ||
      weatherSecondaryLabel === null ||
      !(weatherIcon instanceof HTMLImageElement)
    ) throw new Error('Invalid layout');
    const currentTime = getMatchingTime();
    const currentState = json?.hourly?.find(
      item => item.time === currentTime
    );
    weatherIcon.src = '/images/' + getWeatherIcon(currentState?.weatherCode);
    weatherLabel.textContent = currentState?.lang_de[0]?.value ?? '?';
    weatherSecondaryLabel.textContent = currentState?.tempC ?? '?';
  }
};