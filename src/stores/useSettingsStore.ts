import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useLocalStorage, usePreferredDark } from '@vueuse/core'
import type { TemperatureUnit } from '@/types/weather'

export const useSettingsStore = defineStore('settings', () => {
  const unit = useLocalStorage<TemperatureUnit>('weather-vue:unit', 'celsius')

  const preferredDark = usePreferredDark()
  const darkModePreference = useLocalStorage<'light' | 'dark' | 'system'>('weather-vue:theme', 'system')

  const isDark = computed(() =>
    darkModePreference.value === 'system' ? preferredDark.value : darkModePreference.value === 'dark',
  )

  function applyDarkClass() {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  watch(isDark, applyDarkClass, { immediate: true })

  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'
  }

  function cycleTheme() {
    darkModePreference.value =
      darkModePreference.value === 'system' ? 'light' : darkModePreference.value === 'light' ? 'dark' : 'system'
  }

  function toggleDark() {
    darkModePreference.value = isDark.value ? 'light' : 'dark'
  }

  const dismissedAlertIds = useLocalStorage<string[]>('weather-vue:dismissed-alerts', [])

  function dismissAlert(id: string) {
    if (!dismissedAlertIds.value.includes(id)) {
      dismissedAlertIds.value = [...dismissedAlertIds.value, id]
    }
  }

  function isAlertDismissed(id: string) {
    return dismissedAlertIds.value.includes(id)
  }

  const selectedLocationId = ref<string | null>(null)

  function selectLocation(id: string | null) {
    selectedLocationId.value = id
  }

  return {
    unit,
    toggleUnit,
    darkModePreference,
    isDark,
    cycleTheme,
    toggleDark,
    dismissedAlertIds,
    dismissAlert,
    isAlertDismissed,
    selectedLocationId,
    selectLocation,
  }
})

export function convertTemperature(celsius: number, unit: TemperatureUnit): number {
  if (unit === 'fahrenheit') return (celsius * 9) / 5 + 32
  return celsius
}

export function formatTemperature(celsius: number, unit: TemperatureUnit, withUnit = true): string {
  const value = Math.round(convertTemperature(celsius, unit))
  return withUnit ? `${value}°${unit === 'celsius' ? 'C' : 'F'}` : `${value}°`
}
