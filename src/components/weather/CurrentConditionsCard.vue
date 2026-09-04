<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore, formatTemperature } from '@/stores/useSettingsStore'
import WeatherScene from '@/components/weather/WeatherScene.vue'
import type { ForecastBundle, SavedLocation } from '@/types/weather'

const props = defineProps<{
  location: SavedLocation
  forecast?: ForecastBundle
  loading?: boolean
}>()

const settings = useSettingsStore()
const { unit } = storeToRefs(settings)

const current = computed(() => props.forecast?.current)
const today = computed(() => props.forecast?.daily[0])

const stats = computed(() => {
  if (!current.value) return []
  return [
    { label: 'Feels like', value: formatTemperature(current.value.feelsLike, unit.value) },
    { label: 'Humidity', value: `${current.value.humidity}%` },
    { label: 'Wind', value: `${Math.round(current.value.windSpeed)} km/h` },
    { label: 'Pressure', value: `${current.value.pressure} hPa` },
    { label: 'UV Index', value: `${current.value.uvIndex}` },
    { label: 'Visibility', value: `${current.value.visibility} km` },
  ]
})
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <WeatherScene
      v-if="current"
      :code="current.condition.code"
      :is-day="current.condition.isDay"
      class="rounded-none"
    />
    <div v-else class="flex h-48 items-center justify-center bg-muted sm:h-56">
      <p class="text-sm text-muted-foreground">{{ loading ? 'Loading forecast…' : 'No data cached yet' }}</p>
    </div>

    <div class="p-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-foreground">{{ location.name }}</h2>
          <p class="text-sm text-muted-foreground">{{ location.region ? `${location.region}, ` : '' }}{{ location.country }}</p>
        </div>
        <div v-if="current" class="text-right">
          <p class="text-4xl font-bold leading-none text-foreground">
            {{ formatTemperature(current.temperature, unit, false) }}
          </p>
          <p class="mt-1 text-sm capitalize text-muted-foreground">{{ current.condition.description }}</p>
        </div>
      </div>

      <div v-if="today" class="mt-3 flex gap-3 text-sm text-muted-foreground">
        <span>H: {{ formatTemperature(today.tempMax, unit) }}</span>
        <span>L: {{ formatTemperature(today.tempMin, unit) }}</span>
        <span>Precip: {{ today.precipitationChance }}%</span>
      </div>

      <div v-if="current" class="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
        <div v-for="stat in stats" :key="stat.label" class="rounded-lg bg-muted/60 p-2.5 text-center">
          <p class="text-[11px] uppercase tracking-wide text-muted-foreground">{{ stat.label }}</p>
          <p class="mt-0.5 text-sm font-semibold text-foreground">{{ stat.value }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
