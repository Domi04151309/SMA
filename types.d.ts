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

declare interface Cluster {

  /**
   * The power of the cluster in W.
   */
  power: number
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

  /**
   * The status of the device.
   */
  status: string

  /**
   * The type of the device.
   */
  type: string|null
}

declare interface EnergyMeter {

  /** The address of the device. */
  address: number,

  /** The type of the device. */
  type: string
}

declare interface Inverter {

  /** The address of the device. */
  address: string,

  /** The operating mode of the device. */
  mode: string|null,

  /** The model of the device. */
  model: string,

  /** The status of the device. */
  status: string,

  /** The vendor of the device. */
  vendor: string
}

declare interface DevicesResponse {

  /** A list of the connected clusters. */
  clusters: Cluster[],

  /** A list of the connected batteries. */
  batteries: Battery[],

  /** A list of the connected energy meters. */
  energyMeters: EnergyMeter[],

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
  astronomy: Astronomy[],
  date: string,
  hourly: WeatherHour[],
  sunHour: string,
  uvIndex: string
}

declare interface SMAValuesReference {
  tag: number
}

type SMAValuesPureValue = number|string|null|SMAValuesReference[];

declare interface SMAValuesValue {
  val: SMAValuesPureValue
}

declare interface SMAValuesResult {
  [a: string]: {
    [b: string]: {
      [c :string]: SMAValuesValue[]
    }
  }
}

declare interface SMAValues {
  error?: number,
  result?: SMAValuesResult
}

declare interface SMASimplifiedValues {
  Bat_CapacRtgWh?: number,
  Bat_Diag_ActlCapacNom?: number,
  Bat_Typ?: string,
  BatChrg_BatChrg?: number,
  BatDsch_BatDsch?: number,
  Battery_ChaStt?: number,
  Battery_CurrentCharging?: number,
  Battery_CurrentDischarging?: number,
  Battery_OpStt?: string,
  Energy_Meter_Add: number,
  GridMs_TotW_Cur: number,
  Inverter_WLim: number,
  Metering_EnMtrTyp: string,
  Metering_GridMs_TotWhIn: number,
  Metering_GridMs_TotWhOut?: number,
  Metering_GridMs_TotWIn: number,
  Metering_GridMs_TotWOut: number,
  Metering_PvGen_PvWh: number,
  Name_Model: string,
  Name_Vendor: string,
  Operation_OpStt: string,
  Operation_RunUsr?: string,
  PvGen_PvW: number
}

declare interface SMALoggerDataPoint {
  t: number,
  v: number|null
}

declare interface SMALoggerResult {
  [a: string]: {
    [b: string]: {
      [c :string]: SMALoggerDataPoint[]
    }
  }
}

declare interface SMALogger {
  result: SMALoggerResult
}

declare interface SMASimplifiedLogger {
  Battery_ChaStt?: SMALoggerDataPoint[],
  Metering_GridMs_TotWhIn: SMALoggerDataPoint[],
  Metering_TotWhOut: SMALoggerDataPoint[],
  PvGen_PvW?: SMALoggerDataPoint[]
}
