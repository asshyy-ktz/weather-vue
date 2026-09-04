<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore, formatTemperature } from '@/stores/useSettingsStore'
import WeatherIcon from '@/components/weather/WeatherIcon.vue'
import type { DailyForecast } from '@/types/weather'

const props = defineProps<{ days: DailyForecast[] }>()

const settings = useSettingsStore()
const { unit } = storeToRefs(settings)

const weekMin = computed(() => Math.min(...props.days.map((d) => d.tempMin)))
const weekMax = computed(() => Math.max(...props.days.map((d) => d.tempMax)))

function barStyle(day: DailyForecast) {
  const span = weekMax.value - weekMin.value || 1
  const left = ((day.tempMin - weekMin.value) / span) * 100
  const width = ((day.tempMax - day.tempMin) / span) * 100
  return { left: `${left}%`, width: `${Math.max(width, 6)}%` }
}

function dayLabel(dateStr: string, index: number) {
  if (index === 0) return 'Today'
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}
</script>

<template>
  <div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
    <h3 class="mb-3 text-sm font-semibold text-foreground">7-day forecast</h3>
    <ul class="divide-y divide-border">
      <li v-for="(day, i) in days" :key="day.date" class="flex items-center gap-3 py-2.5">
        <span class="w-12 shrink-0 text-sm font-medium text-foreground">{{ dayLabel(day.date, i) }}</span>
        <WeatherIcon :code="day.condition.code" :is-day="true" :size="26" />
        <span class="w-9 shrink-0 text-right text-xs text-sky-500">{{ day.precipitationChance }}%</span>
        <span class="w-9 shrink-0 text-right text-sm text-muted-foreground">
          {{ formatTemperature(day.tempMin, unit, false) }}
        </span>
        <div class="relative h-1.5 flex-1 rounded-full bg-muted">
          <div class="absolute h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-amber-400" :style="barStyle(day)" />
        </div>
        <span class="w-9 shrink-0 text-sm font-semibold text-foreground">
          {{ formatTemperature(day.tempMax, unit, false) }}
        </span>
      </li>
    </ul>
  </div>
</template>
