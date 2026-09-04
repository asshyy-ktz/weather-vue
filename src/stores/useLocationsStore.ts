import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ForecastBundle, SavedLocation } from '@/types/weather'
import {
  deleteForecastRecord,
  deleteLocationRecord,
  getAllForecasts,
  getAllLocations,
  putForecast,
  putLocation,
  putLocations,
} from '@/services/db'
import { fetchForecast, geocodeLocation, type GeocodeResult } from '@/services/weatherService'
import { seedDatabaseIfEmpty } from '@/data/seed'

function makeId(name: string, lat: number, lon: number): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `loc-${slug}-${lat.toFixed(2)}-${lon.toFixed(2)}`
}

export const useLocationsStore = defineStore('locations', () => {
  const locations = ref<SavedLocation[]>([])
  const forecasts = ref<Record<string, ForecastBundle>>({})
  const loadingIds = ref<Set<string>>(new Set())
  const errorIds = ref<Set<string>>(new Set())
  const initialized = ref(false)

  const sortedLocations = computed(() => [...locations.value].sort((a, b) => a.order - b.order))
  const currentLocationEntry = computed(() => locations.value.find((l) => l.isCurrentLocation) ?? null)
  const savedOnly = computed(() => sortedLocations.value.filter((l) => !l.isCurrentLocation))

  async function init() {
    if (initialized.value) return
    await seedDatabaseIfEmpty()
    const [locs, allForecasts] = await Promise.all([getAllLocations(), getAllForecasts()])
    locations.value = locs
    const map: Record<string, ForecastBundle> = {}
    for (const f of allForecasts) map[f.locationId] = f
    forecasts.value = map
    initialized.value = true

    // Refresh everything in the background if online; offline just serves cache.
    if (navigator.onLine) {
      void refreshAll()
    }
  }

  function isStale(bundle: ForecastBundle): boolean {
    return Date.now() - new Date(bundle.fetchedAt).getTime() > 30 * 60_000
  }

  async function ensureForecast(id: string): Promise<ForecastBundle | undefined> {
    const cached = forecasts.value[id]
    if (!cached || isStale(cached)) {
      if (navigator.onLine) await refreshLocation(id)
    }
    return forecasts.value[id]
  }

  async function refreshLocation(id: string) {
    const loc = locations.value.find((l) => l.id === id)
    if (!loc) return
    loadingIds.value = new Set(loadingIds.value).add(id)
    try {
      const bundle = await fetchForecast(loc.id, loc.lat, loc.lon)
      forecasts.value = { ...forecasts.value, [id]: bundle }
      await putForecast(bundle)
      if (errorIds.value.has(id)) {
        const next = new Set(errorIds.value)
        next.delete(id)
        errorIds.value = next
      }
    } catch {
      errorIds.value = new Set(errorIds.value).add(id)
    } finally {
      const next = new Set(loadingIds.value)
      next.delete(id)
      loadingIds.value = next
    }
  }

  async function refreshAll() {
    await Promise.all(locations.value.map((l) => refreshLocation(l.id)))
  }

  async function addLocation(result: GeocodeResult): Promise<SavedLocation> {
    const id = makeId(result.name, result.lat, result.lon)
    const existing = locations.value.find((l) => l.id === id)
    if (existing) return existing

    const location: SavedLocation = {
      id,
      name: result.name,
      region: result.region,
      country: result.country,
      lat: result.lat,
      lon: result.lon,
      timezoneOffsetMinutes: result.timezoneOffsetMinutes,
      isCurrentLocation: false,
      order: locations.value.length,
      createdAt: Date.now(),
    }
    locations.value = [...locations.value, location]
    await putLocation(location)
    await refreshLocation(id)
    return location
  }

  async function upsertCurrentLocation(result: GeocodeResult): Promise<SavedLocation> {
    const existing = currentLocationEntry.value
    const id = existing?.id ?? 'loc-current-position'
    const location: SavedLocation = {
      id,
      name: result.name,
      region: result.region,
      country: result.country,
      lat: result.lat,
      lon: result.lon,
      timezoneOffsetMinutes: result.timezoneOffsetMinutes,
      isCurrentLocation: true,
      order: -1,
      createdAt: existing?.createdAt ?? Date.now(),
    }
    locations.value = [location, ...locations.value.filter((l) => l.id !== id)]
    await putLocation(location)
    await refreshLocation(id)
    return location
  }

  async function removeLocation(id: string) {
    locations.value = locations.value.filter((l) => l.id !== id)
    const next = { ...forecasts.value }
    delete next[id]
    forecasts.value = next
    await deleteLocationRecord(id)
    await deleteForecastRecord(id)
    await reindexOrder()
  }

  async function reindexOrder() {
    const reordered = savedOnly.value.map((loc, index) => ({ ...loc, order: index }))
    locations.value = locations.value.map((loc) => reordered.find((r) => r.id === loc.id) ?? loc)
    if (reordered.length) await putLocations(reordered)
  }

  async function reorderLocations(orderedIds: string[]) {
    const byId = new Map(locations.value.map((l) => [l.id, l]))
    const reordered: SavedLocation[] = []
    orderedIds.forEach((id, index) => {
      const loc = byId.get(id)
      if (loc) reordered.push({ ...loc, order: index })
    })
    locations.value = locations.value.map((loc) => reordered.find((r) => r.id === loc.id) ?? loc)
    await putLocations(reordered)
  }

  /** Reorders the saved (non-current-location) list by moving `fromId` next to `toId`. */
  async function reorder(fromId: string, toId: string) {
    const list = savedOnly.value.slice()
    const fromIndex = list.findIndex((l) => l.id === fromId)
    const toIndex = list.findIndex((l) => l.id === toId)
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return
    const [moved] = list.splice(fromIndex, 1)
    list.splice(toIndex, 0, moved)
    await reorderLocations(list.map((l) => l.id))
  }

  async function search(query: string): Promise<GeocodeResult[]> {
    return geocodeLocation(query)
  }

  function forecastFor(id: string): ForecastBundle | undefined {
    return forecasts.value[id]
  }

  function isLoading(id: string): boolean {
    return loadingIds.value.has(id)
  }

  function hasError(id: string): boolean {
    return errorIds.value.has(id)
  }

  return {
    locations,
    sortedLocations,
    savedOnly,
    currentLocationEntry,
    forecasts,
    initialized,
    init,
    ensureForecast,
    refreshLocation,
    refreshAll,
    addLocation,
    upsertCurrentLocation,
    removeLocation,
    reorderLocations,
    reorder,
    search,
    forecastFor,
    isLoading,
    hasError,
  }
})
