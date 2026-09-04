import type {
  Condition,
  ConditionCode,
  CurrentConditions,
  DailyForecast,
  ForecastBundle,
  HourlyForecast,
  WeatherAlert,
} from '@/types/weather'

/**
 * weatherService — mocked as if it were a thin client over a real weather API
 * (e.g. Open-Meteo / NWS style responses). Every function is async and returns
 * realistic response shapes, but the numbers are generated deterministically
 * from the location's coordinates and the requested date so the same location
 * always produces the same "forecast" for a given day, and refreshing doesn't
 * make numbers jump around randomly the way a naive Math.random() mock would.
 */

// ---------- Deterministic PRNG ----------

/** Small string hash -> 32-bit int, used to seed the PRNG per location+date. */
function hashSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Mulberry32 deterministic PRNG — fast, good enough spread for mock data. */
function mulberry32(seed: number): () => number {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function rngFor(lat: number, lon: number, dateKey: string): () => number {
  const seed = hashSeed(`${lat.toFixed(2)}:${lon.toFixed(2)}:${dateKey}`)
  return mulberry32(seed)
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// ---------- Climate model ----------

/**
 * Very rough latitude/season-based baseline mean temperature (°C) — enough to
 * make Reykjavik cold, Dubai hot, and give every location a plausible annual
 * cycle without needing a real climate dataset.
 */
function baselineTemperature(lat: number, dayOfYear: number): number {
  const latFactor = Math.cos((lat * Math.PI) / 180) // ~1 at equator, ~0 at poles
  const equatorMean = 27
  const poleMean = -8
  const meanForLat = poleMean + (equatorMean - poleMean) * latFactor

  // Seasonal swing is bigger away from the equator; Northern hemisphere peaks
  // mid-year, Southern hemisphere peaks around day 0/365.
  const seasonalAmplitude = 18 * (1 - latFactor) + 2
  const hemisphereSign = lat >= 0 ? 1 : -1
  const seasonalPhase = ((dayOfYear - 172) / 365) * 2 * Math.PI // peak ~day 172 (late June)
  const seasonal = hemisphereSign * seasonalAmplitude * Math.cos(seasonalPhase)

  return meanForLat + seasonal
}

/** Diurnal (time-of-day) temperature offset: coolest ~05:00, warmest ~15:00. */
function diurnalOffset(hour: number, amplitude: number): number {
  const phase = ((hour - 15) / 24) * 2 * Math.PI
  return amplitude * Math.cos(phase)
}

const CONDITION_LIBRARY: { code: ConditionCode; description: string; weight: number; wetness: number }[] = [
  { code: 'clear', description: 'Clear sky', weight: 5, wetness: 0 },
  { code: 'partly-cloudy', description: 'Partly cloudy', weight: 4, wetness: 0.1 },
  { code: 'cloudy', description: 'Overcast', weight: 3, wetness: 0.2 },
  { code: 'fog', description: 'Foggy', weight: 1, wetness: 0.15 },
  { code: 'drizzle', description: 'Light drizzle', weight: 2, wetness: 0.5 },
  { code: 'rain', description: 'Rain showers', weight: 2, wetness: 0.75 },
  { code: 'heavy-rain', description: 'Heavy rain', weight: 1, wetness: 0.9 },
  { code: 'thunderstorm', description: 'Thunderstorms', weight: 1, wetness: 0.85 },
  { code: 'snow', description: 'Snow showers', weight: 1, wetness: 0.6 },
  { code: 'sleet', description: 'Sleet', weight: 1, wetness: 0.55 },
  { code: 'windy', description: 'Windy', weight: 1, wetness: 0.1 },
]

function pickCondition(rng: () => number, meanTemp: number, humidityBias: number): (typeof CONDITION_LIBRARY)[number] {
  const pool = CONDITION_LIBRARY.filter((c) => {
    if (c.code === 'snow' || c.code === 'sleet') return meanTemp < 4
    if (c.code === 'thunderstorm') return meanTemp > 8
    return true
  })
  const weighted: (typeof CONDITION_LIBRARY)[number][] = []
  for (const c of pool) {
    const w = Math.max(1, Math.round(c.weight * (1 + (humidityBias - 0.5) * (c.wetness - 0.2))))
    for (let i = 0; i < w; i++) weighted.push(c)
  }
  return weighted[Math.floor(rng() * weighted.length)] ?? pool[0]
}

function isDaytime(hour: number, sunriseHour: number, sunsetHour: number): boolean {
  return hour >= sunriseHour && hour < sunsetHour
}

function buildCondition(rng: () => number, meanTemp: number, humidityBias: number, isDay: boolean): Condition {
  const picked = pickCondition(rng, meanTemp, humidityBias)
  return { code: picked.code, description: picked.description, isDay }
}

// ---------- Simulated network latency ----------

function networkDelay(): Promise<void> {
  const ms = 180 + Math.floor(Math.random() * 260)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------- Public API ----------

export interface GeocodeResult {
  name: string
  region: string
  country: string
  lat: number
  lon: number
  timezoneOffsetMinutes: number
}

/**
 * Mocked geocoding lookup — searches a small built-in gazetteer by name.
 * A real integration would hit a geocoding endpoint; this keeps the same
 * async signature so swapping in a live API later only touches this file.
 */
export async function geocodeLocation(query: string): Promise<GeocodeResult[]> {
  await networkDelay()
  const q = query.trim().toLowerCase()
  if (!q) return []
  return GAZETTEER.filter(
    (g) => g.name.toLowerCase().includes(q) || g.country.toLowerCase().includes(q) || g.region.toLowerCase().includes(q),
  ).slice(0, 8)
}

/**
 * Fetches a full forecast bundle (current + hourly + daily + alerts) for a
 * location, generated deterministically from its coordinates and today's date.
 */
export async function fetchForecast(locationId: string, lat: number, lon: number): Promise<ForecastBundle> {
  await networkDelay()
  const now = new Date()
  const dayOfYear = Math.floor(
    (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
      Date.UTC(now.getUTCFullYear(), 0, 0)) /
      86400000,
  )

  const rngDay = rngFor(lat, lon, isoDate(now))
  const meanTemp = baselineTemperature(lat, dayOfYear)
  const diurnalAmplitude = 5 + rngDay() * 4
  const humidityBias = clamp(0.3 + Math.abs(Math.sin((lat * Math.PI) / 180)) * -0.2 + rngDay() * 0.4, 0.15, 0.95)

  const sunriseHour = 6 + (rngDay() - 0.5) * 2
  const sunsetHour = 18 + (rngDay() - 0.5) * 2

  const currentHour = now.getHours() + now.getMinutes() / 60
  const currentIsDay = isDaytime(currentHour, sunriseHour, sunsetHour)
  const currentTemp = meanTemp + diurnalOffset(currentHour, diurnalAmplitude)
  const currentCondition = buildCondition(rngFor(lat, lon, `${isoDate(now)}:cur`), meanTemp, humidityBias, currentIsDay)

  const current: CurrentConditions = {
    temperature: round1(currentTemp),
    feelsLike: round1(currentTemp + feelsLikeAdjustment(currentTemp, humidityBias, rngDay())),
    humidity: Math.round(humidityBias * 100),
    windSpeed: round1(3 + rngDay() * 22),
    windDirection: Math.round(rngDay() * 360),
    pressure: Math.round(995 + rngDay() * 35),
    uvIndex: Math.round(clamp(currentIsDay ? (1 - Math.abs(lat) / 90) * 11 * (0.6 + rngDay() * 0.4) : 0, 0, 11)),
    visibility: round1(clamp(currentCondition.code === 'fog' ? 0.5 + rngDay() * 2 : 8 + rngDay() * 8, 0.2, 16)),
    condition: currentCondition,
    observedAt: now.toISOString(),
  }

  const hourly: HourlyForecast[] = []
  for (let i = 0; i < 48; i++) {
    const t = new Date(now.getTime() + i * 3600_000)
    const h = t.getHours() + t.getMinutes() / 60
    const dKey = isoDate(t)
    const rngHour = rngFor(lat, lon, `${dKey}:${t.getHours()}`)
    const dayNum = Math.floor(
      (Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) - Date.UTC(t.getUTCFullYear(), 0, 0)) / 86400000,
    )
    const dayMean = baselineTemperature(lat, dayNum)
    const temp = dayMean + diurnalOffset(h, diurnalAmplitude)
    const day = isDaytime(h, sunriseHour, sunsetHour)
    const condition = buildCondition(rngHour, dayMean, humidityBias, day)
    hourly.push({
      time: t.toISOString(),
      temperature: round1(temp),
      feelsLike: round1(temp + feelsLikeAdjustment(temp, humidityBias, rngHour())),
      precipitationChance: Math.round(clamp(rngHour() * (condition.code === 'clear' ? 10 : 80), 0, 100)),
      condition,
      windSpeed: round1(2 + rngHour() * 20),
      humidity: Math.round(clamp(humidityBias * 100 + (rngHour() - 0.5) * 15, 10, 100)),
    })
  }

  const daily: DailyForecast[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i))
    const dKey = isoDate(d)
    const rngD = rngFor(lat, lon, dKey)
    const dayNum = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000)
    const dMean = baselineTemperature(lat, dayNum)
    const spread = 3 + rngD() * 4
    const condition = buildCondition(rngD, dMean, humidityBias, true)
    daily.push({
      date: dKey,
      tempMin: round1(dMean - spread),
      tempMax: round1(dMean + spread * 0.8),
      precipitationChance: Math.round(clamp(rngD() * (condition.code === 'clear' ? 15 : 85), 0, 100)),
      condition,
      sunrise: formatClock(sunriseHour + (rngD() - 0.5) * 0.3),
      sunset: formatClock(sunsetHour + (rngD() - 0.5) * 0.3),
      windSpeed: round1(3 + rngD() * 20),
      humidity: Math.round(clamp(humidityBias * 100 + (rngD() - 0.5) * 10, 10, 100)),
      uvIndex: Math.round(clamp((1 - Math.abs(lat) / 90) * 11 * (0.5 + rngD() * 0.5), 0, 11)),
    })
  }

  const alerts = buildAlerts(locationId, lat, lon, current, daily)

  return {
    locationId,
    fetchedAt: now.toISOString(),
    current,
    hourly,
    daily,
    alerts,
  }
}

// ---------- Alerts (mocked severe weather data) ----------

function buildAlerts(
  locationId: string,
  lat: number,
  lon: number,
  current: CurrentConditions,
  daily: DailyForecast[],
): WeatherAlert[] {
  const rng = rngFor(lat, lon, `${isoDate(new Date())}:alerts`)
  const alerts: WeatherAlert[] = []
  const now = new Date()

  const severeConditions: ConditionCode[] = ['thunderstorm', 'heavy-rain', 'snow', 'sleet']
  const upcomingSevere = daily.find((d) => severeConditions.includes(d.condition.code))

  if (upcomingSevere && rng() > 0.35) {
    const severity = upcomingSevere.condition.code === 'thunderstorm' || upcomingSevere.windSpeed > 18 ? 'warning' : 'watch'
    const kind =
      upcomingSevere.condition.code === 'thunderstorm'
        ? 'Severe Thunderstorm'
        : upcomingSevere.condition.code === 'snow'
          ? 'Winter Storm'
          : upcomingSevere.condition.code === 'sleet'
            ? 'Ice Storm'
            : 'Flood'
    alerts.push({
      id: `${locationId}-${kind.toLowerCase().replace(/\s+/g, '-')}-${upcomingSevere.date}`,
      severity,
      title: `${kind} ${severity === 'warning' ? 'Warning' : 'Watch'}`,
      description: `${kind} conditions are expected around ${upcomingSevere.date}, with sustained winds near ${Math.round(
        upcomingSevere.windSpeed,
      )} km/h and a ${upcomingSevere.precipitationChance}% chance of precipitation. Residents should secure loose outdoor objects and monitor local updates.`,
      effective: now.toISOString(),
      expires: new Date(now.getTime() + 36 * 3600_000).toISOString(),
      areas: 'Local area and surrounding region',
    })
  }

  if (current.uvIndex >= 9 && rng() > 0.4) {
    alerts.push({
      id: `${locationId}-uv-${isoDate(now)}`,
      severity: 'advisory',
      title: 'Extreme UV Advisory',
      description: `The UV index is expected to reach ${current.uvIndex} today. Limit direct sun exposure between 11am and 3pm, wear sunscreen, and stay hydrated.`,
      effective: now.toISOString(),
      expires: new Date(now.getTime() + 12 * 3600_000).toISOString(),
      areas: 'Local area',
    })
  }

  if (current.windSpeed > 28 && rng() > 0.3) {
    alerts.push({
      id: `${locationId}-wind-${isoDate(now)}`,
      severity: current.windSpeed > 40 ? 'warning' : 'advisory',
      title: current.windSpeed > 40 ? 'High Wind Warning' : 'Wind Advisory',
      description: `Sustained winds of ${Math.round(current.windSpeed)} km/h are affecting the area. Secure outdoor furniture and use caution when driving high-profile vehicles.`,
      effective: now.toISOString(),
      expires: new Date(now.getTime() + 18 * 3600_000).toISOString(),
      areas: 'Local area and coastal zones',
    })
  }

  return alerts
}

// ---------- Helpers ----------

function feelsLikeAdjustment(temp: number, humidityBias: number, r: number): number {
  if (temp >= 26) {
    // Heat index effect: humidity makes it feel hotter.
    return humidityBias * 4 + r * 1.5
  }
  if (temp <= 8) {
    // Wind chill-ish: cooler than actual in cold, dry-ish air.
    return -((1 - humidityBias) * 3 + r * 1.5)
  }
  return (r - 0.5) * 1.2
}

function formatClock(hourFloat: number): string {
  const h = Math.floor(((hourFloat % 24) + 24) % 24)
  const m = Math.round((hourFloat - Math.floor(hourFloat)) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function round1(v: number): number {
  return Math.round(v * 10) / 10
}

// ---------- Built-in gazetteer for the mock geocoder + initial seed set ----------

export const GAZETTEER: GeocodeResult[] = [
  { name: 'New York', region: 'New York', country: 'United States', lat: 40.7128, lon: -74.006, timezoneOffsetMinutes: -300 },
  { name: 'London', region: 'England', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, timezoneOffsetMinutes: 0 },
  { name: 'Tokyo', region: 'Kanto', country: 'Japan', lat: 35.6762, lon: 139.6503, timezoneOffsetMinutes: 540 },
  { name: 'Sydney', region: 'New South Wales', country: 'Australia', lat: -33.8688, lon: 151.2093, timezoneOffsetMinutes: 660 },
  { name: 'Reykjavik', region: 'Capital Region', country: 'Iceland', lat: 64.1466, lon: -21.9426, timezoneOffsetMinutes: 0 },
  { name: 'Dubai', region: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708, timezoneOffsetMinutes: 240 },
  { name: 'Cape Town', region: 'Western Cape', country: 'South Africa', lat: -33.9249, lon: 18.4241, timezoneOffsetMinutes: 120 },
  { name: 'Nairobi', region: 'Nairobi County', country: 'Kenya', lat: -1.2921, lon: 36.8219, timezoneOffsetMinutes: 180 },
  { name: 'Vancouver', region: 'British Columbia', country: 'Canada', lat: 49.2827, lon: -123.1207, timezoneOffsetMinutes: -480 },
  { name: 'Singapore', region: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198, timezoneOffsetMinutes: 480 },
  { name: 'Paris', region: 'Ile-de-France', country: 'France', lat: 48.8566, lon: 2.3522, timezoneOffsetMinutes: 60 },
  { name: 'Mexico City', region: 'CDMX', country: 'Mexico', lat: 19.4326, lon: -99.1332, timezoneOffsetMinutes: -360 },
]

export const DEFAULT_SEED_CITIES = ['New York', 'London', 'Tokyo', 'Sydney', 'Reykjavik', 'Dubai', 'Cape Town']
