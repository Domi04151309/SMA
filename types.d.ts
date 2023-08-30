declare interface Energy {
  fromBattery: number,
  fromGrid: number,
  fromRoof: number,
  toBattery: number,
  toGrid: number
}

declare interface Power {
  currentUsage: number,
  fromBattery: number,
  fromGrid: number,
  fromRoof: number,
  toBattery: number,
  toGrid: number
}

declare interface NowResponse {
  batteryPercentage: number|null,
  energy: Energy,
  power: Power,
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

declare interface DevicesResponse {
  batteries: Battery[],
  energyMeters: number[],
  inverters: Inverter[]
}

declare interface Astronomy {
  sunrise: string,
  sunset: string
}

declare interface WeatherTranslation {
  value: string
}

declare interface WeatherHour {
  chanceoffog: string,
  chanceofovercast: string,
  chanceofrain: string,
  chanceofsnow: string,
  chanceofsunshine: string,
  lang_de: WeatherTranslation[],
  time: string
}

declare interface WeatherResponse {
  astronomy: Astronomy[],
  date: string,
  hourly: WeatherHour[],
  sunHour: string,
  uvIndex: string
}