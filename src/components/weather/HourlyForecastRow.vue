<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore, formatTemperature } from '@/stores/useSettingsStore'
import WeatherIcon from '@/components/weather/WeatherIcon.vue'
import type { HourlyForecast } from '@/types/weather'

const props = defineProps<{ hours: HourlyForecast[] }>()

const settings = useSettingsStore()
const { unit } = storeToRefs(settings)

const items = computed(() =>
  props.hours.slice(0, 24).map((h) => ({
    ...h,
    label: new Date(h.time).toLocaleTimeString(undefined, { hour: 'numeric' }),
  })),
)
</script>

<template>
  <div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
    <h3 class="mb-3 text-sm font-semibold text-foreground">Hourly forecast</h3>
    <div class="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      <div
        v-for="(hour, i) in items"
        :key="hour.time"
        class="flex min-w-[64px] flex-col items-center gap-2 rounded-xl px-2 py-3"
        :class="i === 0 ? 'bg-primary/10' : ''"
      >
        <span class="text-xs text-muted-foreground">{{ i === 0 ? 'Now' : hour.label }}</span>
        <WeatherIcon :code="hour.condition.code" :is-day="hour.condition.isDay" :size="30" />
        <span class="text-sm font-semibold text-foreground">{{ formatTemperature(hour.temperature, unit, false) }}</span>
        <span class="text-[11px] text-sky-500">{{ hour.precipitationChance }}%</span>
      </div>
    </div>
  </div>
</template>
