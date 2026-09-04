<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore, formatTemperature } from '@/stores/useSettingsStore'
import { useWeatherVisuals } from '@/composables/useWeatherVisuals'
import WeatherIcon from '@/components/weather/WeatherIcon.vue'
import type { ForecastBundle, SavedLocation } from '@/types/weather'

/**
 * Home-screen-widget-style compact summary card. Usable standalone anywhere
 * a small at-a-glance weather tile is needed (saved locations list, a
 * dashboard rail, etc).
 */
const props = defineProps<{
  location: SavedLocation
  forecast?: ForecastBundle
  selected?: boolean
  draggable?: boolean
}>()

defineEmits<{ click: []; dragstart: [DragEvent]; dragover: [DragEvent]; drop: [DragEvent]; dragend: [] }>()

const settings = useSettingsStore()
const { unit } = storeToRefs(settings)
const { visualFor } = useWeatherVisuals()

const current = computed(() => props.forecast?.current)
const today = computed(() => props.forecast?.daily[0])
const visual = computed(() =>
  current.value ? visualFor(current.value.condition.code, current.value.condition.isDay) : null,
)
</script>

<template>
  <button
    type="button"
    class="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-border bg-gradient-to-br p-3.5 text-left shadow-sm transition hover:shadow-md"
    :class="[
      visual ? visual.gradientClass : 'from-muted to-muted',
      selected ? 'ring-2 ring-primary' : '',
    ]"
    :draggable="draggable"
    @click="$emit('click')"
    @dragstart="$emit('dragstart', $event)"
    @dragover.prevent="$emit('dragover', $event)"
    @drop="$emit('drop', $event)"
    @dragend="$emit('dragend')"
  >
    <span
      v-if="location.isCurrentLocation"
      class="absolute right-2 top-2 rounded-full bg-black/25 px-1.5 py-0.5 text-[10px] font-medium text-white"
    >
      Current
    </span>

    <WeatherIcon
      v-if="current"
      :code="current.condition.code"
      :is-day="current.condition.isDay"
      :size="40"
    />
    <div v-else class="flex h-10 w-10 items-center justify-center text-white/70">…</div>

    <div class="min-w-0 flex-1 text-white">
      <p class="truncate text-sm font-semibold">{{ location.name }}</p>
      <p class="truncate text-xs text-white/80">{{ current?.condition.description ?? 'Loading…' }}</p>
    </div>

    <div v-if="current" class="text-right text-white">
      <p class="text-2xl font-bold leading-none">{{ formatTemperature(current.temperature, unit, false) }}</p>
      <p v-if="today" class="mt-1 text-[11px] text-white/80">
        {{ formatTemperature(today.tempMax, unit, false) }}° / {{ formatTemperature(today.tempMin, unit, false) }}°
      </p>
    </div>
  </button>
</template>
