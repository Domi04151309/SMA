declare interface ApiNowResponse {
  batteryPercentage: number|null,
  energy: {
    fromBattery: number,
    fromGrid: number,
    fromRoof: number,
    toBattery: number,
    toGrid: number
  },
  power: {
    currentUsage: number,
    fromBattery: number,
    fromGrid: number,
    fromRoof: number,
    toBattery: number,
    toGrid: number
  },
  timestamp: number
}

declare interface Battery {
  capacity: number,
  capacityOfOriginalCapacity: number
}

declare interface Inverter {
  address: string,
  mode: string,
  model: string,
  status: string,
  vendor: string
}

declare interface ApiDevicesResponse {
  batteries: Battery[],
  energyMeters: number[],
  inverters: Inverter[]
}

declare interface WeatherHour {
  chanceoffog: string,
  chanceofovercast: string,
  chanceofrain: string,
  chanceofsnow: string,
  chanceofsunshine: string,
  lang_de: [{ value: string }]
  time: string
}

declare interface ApiWeatherResponse {
  astronomy: [{
    sunrise: string,
    sunset: string
  }],
  date: string,
  hourly: WeatherHour[],
  sunHour: string,
  uvIndex: string
}
