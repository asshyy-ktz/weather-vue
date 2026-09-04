import { ref } from 'vue'
import { useLocationsStore } from '@/stores/useLocationsStore'
import { GAZETTEER } from '@/services/weatherService'
import type { GeocodeResult } from '@/services/weatherService'

export type GeolocationStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unsupported' | 'error'

/**
 * Wraps the browser Geolocation API to resolve a "current location" saved
 * location + forecast. Denial and unsupported browsers are handled
 * gracefully — the rest of the app keeps working with saved locations only.
 */
export function useCurrentLocation() {
  const status = ref<GeolocationStatus>('idle')
  const errorMessage = ref('')
  const locationsStore = useLocationsStore()

  function nearestGazetteerCity(lat: number, lon: number): GeocodeResult {
    let best = GAZETTEER[0]
    let bestDist = Infinity
    for (const city of GAZETTEER) {
      const dist = (city.lat - lat) ** 2 + (city.lon - lon) ** 2
      if (dist < bestDist) {
        bestDist = dist
        best = city
      }
    }
    // Keep the real device coordinates but label with the nearest known city
    // name so the mock weather service produces geographically sensible data.
    return { ...best, lat, lon }
  }

  async function locate(): Promise<void> {
    if (!('geolocation' in navigator)) {
      status.value = 'unsupported'
      errorMessage.value = 'Geolocation is not supported in this browser.'
      return
    }

    status.value = 'locating'
    errorMessage.value = ''

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          const result = nearestGazetteerCity(latitude, longitude)
          result.name = 'Current Location'
          await locationsStore.upsertCurrentLocation(result)
          status.value = 'granted'
          resolve()
        },
        (err) => {
          status.value = err.code === err.PERMISSION_DENIED ? 'denied' : 'error'
          errorMessage.value =
            err.code === err.PERMISSION_DENIED
              ? 'Location access was denied. Enable it in your browser settings to see local weather.'
              : 'Unable to determine your location right now.'
          resolve()
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60_000 },
      )
    })
  }

  return { status, errorMessage, locate }
}
