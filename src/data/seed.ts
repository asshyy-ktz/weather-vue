import { GAZETTEER, DEFAULT_SEED_CITIES, fetchForecast } from '@/services/weatherService'
import { getAllLocations, getMeta, putForecast, putLocations, setMeta } from '@/services/db'
import type { SavedLocation } from '@/types/weather'

const SEED_FLAG_KEY = 'seeded'

/**
 * On first launch, populates IndexedDB with a handful of realistic mock
 * locations (real city names/coordinates) and their forecasts so the app has
 * useful content before geolocation or search have run. Subsequent launches
 * are a no-op — existing saved locations and cached forecasts are left alone.
 */
export async function seedDatabaseIfEmpty(): Promise<void> {
  const alreadySeeded = await getMeta<boolean>(SEED_FLAG_KEY)
  if (alreadySeeded) return

  const existing = await getAllLocations()
  if (existing.length > 0) {
    await setMeta(SEED_FLAG_KEY, true)
    return
  }

  const cities = DEFAULT_SEED_CITIES.map((name) => GAZETTEER.find((g) => g.name === name)).filter(
    (g): g is NonNullable<typeof g> => Boolean(g),
  )

  const locations: SavedLocation[] = cities.map((city, index) => ({
    id: `loc-${city.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: city.name,
    region: city.region,
    country: city.country,
    lat: city.lat,
    lon: city.lon,
    timezoneOffsetMinutes: city.timezoneOffsetMinutes,
    isCurrentLocation: false,
    order: index,
    createdAt: Date.now() - (cities.length - index) * 1000,
  }))

  await putLocations(locations)

  await Promise.all(
    locations.map(async (loc) => {
      const bundle = await fetchForecast(loc.id, loc.lat, loc.lon)
      await putForecast(bundle)
    }),
  )

  await setMeta(SEED_FLAG_KEY, true)
}
