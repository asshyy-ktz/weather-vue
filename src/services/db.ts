import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ForecastBundle, SavedLocation } from '@/types/weather'

const DB_NAME = 'weather-vue-db'
const DB_VERSION = 1

interface WeatherDB extends DBSchema {
  locations: {
    key: string
    value: SavedLocation
    indexes: { 'by-order': number }
  }
  forecasts: {
    key: string
    value: ForecastBundle
  }
  meta: {
    key: string
    value: { key: string; value: unknown }
  }
}

let dbPromise: Promise<IDBPDatabase<WeatherDB>> | null = null

export function getDb(): Promise<IDBPDatabase<WeatherDB>> {
  if (!dbPromise) {
    dbPromise = openDB<WeatherDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('locations')) {
          const store = db.createObjectStore('locations', { keyPath: 'id' })
          store.createIndex('by-order', 'order')
        }
        if (!db.objectStoreNames.contains('forecasts')) {
          db.createObjectStore('forecasts', { keyPath: 'locationId' })
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

// ---------- Locations ----------

export async function putLocation(location: SavedLocation): Promise<void> {
  const db = await getDb()
  await db.put('locations', location)
}

export async function putLocations(locations: SavedLocation[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('locations', 'readwrite')
  await Promise.all([...locations.map((l) => tx.store.put(l)), tx.done])
}

export async function getAllLocations(): Promise<SavedLocation[]> {
  const db = await getDb()
  const all = await db.getAllFromIndex('locations', 'by-order')
  return all.sort((a, b) => a.order - b.order)
}

export async function deleteLocationRecord(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('locations', id)
}

// ---------- Forecasts (offline cache, one per location) ----------

export async function putForecast(bundle: ForecastBundle): Promise<void> {
  const db = await getDb()
  await db.put('forecasts', bundle)
}

export async function getForecast(locationId: string): Promise<ForecastBundle | undefined> {
  const db = await getDb()
  return db.get('forecasts', locationId)
}

export async function getAllForecasts(): Promise<ForecastBundle[]> {
  const db = await getDb()
  return db.getAll('forecasts')
}

export async function deleteForecastRecord(locationId: string): Promise<void> {
  const db = await getDb()
  await db.delete('forecasts', locationId)
}

// ---------- Meta (seed flag, etc.) ----------

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDb()
  await db.put('meta', { key, value })
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const db = await getDb()
  const row = await db.get('meta', key)
  return row?.value as T | undefined
}
