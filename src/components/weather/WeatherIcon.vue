<script setup lang="ts">
import { computed } from 'vue'
import type { ConditionCode } from '@/types/weather'

const props = withDefaults(
  defineProps<{
    code: ConditionCode
    isDay?: boolean
    size?: number
  }>(),
  { isDay: true, size: 40 },
)

const showSun = computed(() => props.isDay && ['clear', 'partly-cloudy', 'windy'].includes(props.code))
const showMoon = computed(() => !props.isDay && ['clear', 'partly-cloudy', 'windy'].includes(props.code))
const showCloud = computed(() =>
  ['partly-cloudy', 'cloudy', 'drizzle', 'rain', 'heavy-rain', 'thunderstorm', 'snow', 'sleet', 'fog'].includes(
    props.code,
  ),
)
const showRain = computed(() => ['drizzle', 'rain', 'heavy-rain', 'thunderstorm', 'sleet'].includes(props.code))
const showSnow = computed(() => ['snow', 'sleet'].includes(props.code))
const showBolt = computed(() => props.code === 'thunderstorm')
const showFogLines = computed(() => props.code === 'fog')
const showWindLines = computed(() => props.code === 'windy')
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    role="img"
    :aria-label="code"
    class="shrink-0"
  >
    <!-- Sun -->
    <g v-if="showSun" style="animation: wx-spin-slow 18s linear infinite; transform-origin: 22px 22px">
      <circle cx="22" cy="22" r="10" class="fill-amber-400" />
      <g class="stroke-amber-400" stroke-width="2.5" stroke-linecap="round">
        <line x1="22" y1="4" x2="22" y2="9" />
        <line x1="22" y1="35" x2="22" y2="40" />
        <line x1="4" y1="22" x2="9" y2="22" />
        <line x1="35" y1="22" x2="40" y2="22" />
        <line x1="9.5" y1="9.5" x2="13" y2="13" />
        <line x1="31" y1="31" x2="34.5" y2="34.5" />
        <line x1="34.5" y1="9.5" x2="31" y2="13" />
        <line x1="13" y1="31" x2="9.5" y2="34.5" />
      </g>
    </g>

    <!-- Moon -->
    <g v-if="showMoon">
      <path
        d="M28 12a12 12 0 1 0 11.5 15.6A9.5 9.5 0 0 1 28 12Z"
        class="fill-slate-200"
      />
      <circle
        v-for="(star, i) in [
          { cx: 46, cy: 12, r: 1.3 },
          { cx: 52, cy: 20, r: 1 },
          { cx: 44, cy: 24, r: 0.8 },
        ]"
        :key="i"
        :cx="star.cx"
        :cy="star.cy"
        :r="star.r"
        class="fill-slate-100"
        :style="{ animation: `wx-twinkle ${2 + i}s ease-in-out infinite` }"
      />
    </g>

    <!-- Fog lines (no cloud) -->
    <g v-if="showFogLines" class="stroke-slate-400" stroke-width="3" stroke-linecap="round">
      <line x1="10" y1="26" x2="54" y2="26" style="animation: wx-drift 5s ease-in-out infinite alternate" />
      <line x1="14" y1="34" x2="50" y2="34" style="animation: wx-drift 6s ease-in-out infinite alternate-reverse" />
      <line x1="10" y1="42" x2="54" y2="42" style="animation: wx-drift 4.5s ease-in-out infinite alternate" />
    </g>

    <!-- Cloud -->
    <g v-if="showCloud" style="animation: wx-bob 6s ease-in-out infinite">
      <path
        d="M20 40a9 9 0 0 1 1.2-17.9 12 12 0 0 1 23 3.4A8.5 8.5 0 0 1 43 40H20Z"
        class="fill-slate-300 dark:fill-slate-400"
      />
    </g>

    <!-- Lightning bolt -->
    <polygon
      v-if="showBolt"
      points="30,42 24,54 29,54 26,62 38,47 32,47 36,42"
      class="fill-amber-300"
      style="animation: wx-flash 3.5s ease-in-out infinite"
    />

    <!-- Rain drops -->
    <g v-if="showRain" class="stroke-sky-400" stroke-width="2.5" stroke-linecap="round">
      <line x1="24" y1="44" x2="21" y2="52" style="animation: wx-fall 1.1s linear infinite" />
      <line x1="32" y1="44" x2="29" y2="52" style="animation: wx-fall 1.1s linear infinite 0.3s" />
      <line x1="40" y1="44" x2="37" y2="52" style="animation: wx-fall 1.1s linear infinite 0.6s" />
    </g>

    <!-- Snow flakes -->
    <g v-if="showSnow" class="fill-white">
      <circle cx="24" cy="46" r="2" style="animation: wx-fall 2.4s linear infinite" />
      <circle cx="32" cy="46" r="2" style="animation: wx-fall 2.4s linear infinite 0.6s" />
      <circle cx="40" cy="46" r="2" style="animation: wx-fall 2.4s linear infinite 1.2s" />
    </g>

    <!-- Wind lines -->
    <g v-if="showWindLines" class="stroke-teal-400" stroke-width="2.5" stroke-linecap="round">
      <line x1="8" y1="48" x2="30" y2="48" style="animation: wx-drift 2.2s ease-in-out infinite alternate" />
      <line x1="14" y1="54" x2="40" y2="54" style="animation: wx-drift 2.6s ease-in-out infinite alternate-reverse" />
    </g>
  </svg>
</template>
