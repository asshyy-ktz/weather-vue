export type ConditionCode =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'thunderstorm'
  | 'snow'
  | 'sleet'
  | 'windy'

export interface Condition {
  code: ConditionCode
  description: string
  /** Whether it's daytime at the moment this condition was computed for. */
  isDay: boolean
}

export interface HourlyForecast {
  /** ISO timestamp for this hour. */
  time: string
  temperature: number
  feelsLike: number
  precipitationChance: number
  condition: Condition
  windSpeed: number
  humidity: number
}

export interface DailyForecast {
  /** ISO date (yyyy-mm-dd). */
  date: string
  tempMin: number
  tempMax: number
  precipitationChance: number
  condition: Condition
  sunrise: string
  sunset: string
  windSpeed: number
  humidity: number
  uvIndex: number
}

export type AlertSeverity = 'advisory' | 'watch' | 'warning'

export interface WeatherAlert {
  id: string
  severity: AlertSeverity
  title: string
  description: string
  effective: string
  expires: string
  areas: string
}

export interface CurrentConditions {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: number
  pressure: number
  uvIndex: number
  visibility: number
  condition: Condition
  observedAt: string
}

export interface ForecastBundle {
  locationId: string
  fetchedAt: string
  current: CurrentConditions
  hourly: HourlyForecast[]
  daily: DailyForecast[]
  alerts: WeatherAlert[]
}

export type TemperatureUnit = 'celsius' | 'fahrenheit'

export interface SavedLocation {
  id: string
  name: string
  region: string
  country: string
  lat: number
  lon: number
  timezoneOffsetMinutes: number
  isCurrentLocation: boolean
  order: number
  createdAt: number
}
