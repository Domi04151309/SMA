declare interface Energy {

  /** The amount of energy transferred from the battery in Wh. */
  fromBattery: number,

  /** The amount of energy transferred from the grid in Wh. */
  fromGrid: number,

  /** The amount of energy transferred from the roof in Wh. */
  fromRoof: number,

  /** The amount of energy transferred to the battery in Wh. */
  toBattery: number,

  /** The amount of energy transferred to the grid in Wh. */
  toGrid: number
}

declare interface Power {

  /** The amount of power that is currently being used by the home in W. */
  currentUsage: number,

  /** The amount of power that is currently transmitted from the battery in W. */
  fromBattery: number,

  /** The amount of power that is currently transmitted from the grid in W. */
  fromGrid: number,

  /** The amount of power that is currently transmitted from the roof in W. */
  fromRoof: number,

  /** The amount of power that is currently transmitted to the battery in W. */
  toBattery: number,

  /** The amount of power that is currently transmitted to the grid in W. */
  toGrid: number
}

declare interface NowResponse {

  /**
   * The battery percentage as a value between 0 and 100 or null if no battery
   * is connected.
   */
  batteryPercentage: number|null,

  /**
   * The amount of energy transferred to and from different sources in Wh.
   */
  energy: Energy,

  /**
   * The amount of power that is currently transmitted to and from different
   * sources in W.
   */
  power: Power,

  /**
   * The timestamp of the measurement as the number of milliseconds elapsed
   * since the epoch, which is defined as the midnight at the beginning of
   * January 1, 1970, UTC.
   */
  timestamp: number
}

declare interface Battery {

  /**
   * The capacity of the battery in Wh.
   */
  capacity: number,

  /**
   * The capacity of the original capacity that remains as a value between 0
   * and 100.
   */
  capacityOfOriginalCapacity: number
}

declare interface Inverter {

  /** The address of the device. */
  address: string,

  /** The operating mode of the device. */
  mode: string,

  /** The model of the device. */
  model: string,

  /** The status of the device. */
  status: string,

  /** The vendor of the device. */
  vendor: string
}

declare interface DevicesResponse {

  /** A list of the connected batteries. */
  batteries: Battery[],

  /** A list of the connected energy meter addresses. */
  energyMeters: number[],

  /** A list of the connected inverters. */
  inverters: Inverter[]
}

declare interface InverterCredentials {
  address: string,
  group: string,
  password: string
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
  tempC: string,
  time: string,
  weatherCode: string
}

declare interface WeatherResponse {
  astronomy?: Astronomy[],
  date?: string,
  hourly?: WeatherHour[],
  sunHour?: string,
  uvIndex?: string
}

declare interface SMADashValuesReference {
  tag: number
}

declare interface SMADashValuesValue {
  val: number|string|null|SMADashValuesReference[]
}

declare interface SMADashValuesResult {
  [a: string]: {
    [b: string]: {
      [c :string]: SMADashValuesValue[]
    }
  }
}

declare interface SMADashValues {
  result: SMADashValuesResult
}

declare interface SMASimplifiedDashValues {
  Bat_CapacRtgWh?: number,
  Bat_Diag_ActlCapacNom?: number,
  BatChrg_BatChrg?: number,
  BatDsch_BatDsch?: number,
  Battery_ChaStt?: number,
  Battery_CurrentCharging?: number,
  Battery_CurrentDischarging?: number,
  Energy_Meter_Add: number,
  GridMs_TotW_Cur: number,
  Metering_GridMs_TotWhIn: number,
  Metering_GridMs_TotWIn: number,
  Metering_GridMs_TotWOut: number,
  Metering_PvGen_PvWh: number,
  Metering_TotWhOut: number,
  Name_Model: string,
  Name_Vendor: string,
  Operation_Health: string,
  Operation_RunStt: string,
  PvGen_PvW: number
}

declare interface SMADashLoggerDataPoint {
  t: number,
  v: number
}

declare interface SMADashLoggerResult {
  [a: string]: {
    [b: string]: {
      [c :string]: SMADashLoggerDataPoint[]
    }
  }
}

declare interface SMADashLogger {
  result: SMADashLoggerResult
}

declare interface SMASimplifiedDashLogger {
  Battery_ChaStt?: SMADashLoggerDataPoint[],
  Metering_GridMs_TotWhIn: SMADashLoggerDataPoint[],
  Metering_TotWhOut: SMADashLoggerDataPoint[],
  PvGen_PvW?: SMADashLoggerDataPoint[]
}
