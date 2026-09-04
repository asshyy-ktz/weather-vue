<script setup lang="ts">
import { computed } from 'vue'
import type { ConditionCode } from '@/types/weather'

const props = withDefaults(
  defineProps<{
    code: ConditionCode
    isDay: boolean
    size?: 'sm' | 'md' | 'lg'
    background?: boolean
  }>(),
  { size: 'md', background: false },
)

const dims = computed(() => ({ sm: 28, md: 48, lg: 96 })[props.size])

const gradient = computed(() => {
  if (!props.isDay) return 'from-slate-900 via-indigo-950 to-slate-900'
  switch (props.code) {
    case 'clear':
      return 'from-sky-400 via-sky-300 to-amber-200'
    case 'partly-cloudy':
      return 'from-sky-400 via-sky-200 to-slate-200'
    case 'cloudy':
    case 'fog':
      return 'from-slate-400 via-slate-300 to-slate-200'
    case 'drizzle':
    case 'rain':
    case 'heavy-rain':
      return 'from-slate-600 via-slate-500 to-slate-400'
    case 'thunderstorm':
      return 'from-slate-800 via-slate-700 to-slate-600'
    case 'snow':
    case 'sleet':
      return 'from-slate-300 via-sky-100 to-slate-200'
    case 'windy':
      return 'from-teal-400 via-sky-300 to-slate-200'
    default:
      return 'from-sky-400 to-sky-200'
  }
})
</script>

<template>
  <div
    v-if="background"
    class="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-b"
    :class="gradient"
    aria-hidden="true"
  >
    <!-- Stars (clear/partly-cloudy night) -->
    <template v-if="!isDay">
      <span
        v-for="i in 18"
        :key="'star-' + i"
        class="absolute rounded-full bg-white"
        :style="{
          width: `${1 + (i % 3)}px`,
          height: `${1 + (i % 3)}px`,
          top: `${(i * 37) % 70}%`,
          left: `${(i * 53) % 100}%`,
          animation: `wx-twinkle ${2 + (i % 4)}s ease-in-out infinite`,
          animationDelay: `${(i % 5) * 0.3}s`,
        }"
      />
    </template>

    <!-- Sun -->
    <div
      v-if="code === 'clear' && isDay"
      class="absolute -top-4 right-6 h-20 w-20 rounded-full bg-amber-200 shadow-[0_0_60px_20px_rgba(252,211,77,0.6)]"
      style="animation: wx-spin-slow 40s linear infinite"
    />
    <!-- Moon -->
    <div
      v-if="code === 'clear' && !isDay"
      class="absolute -top-2 right-8 h-14 w-14 rounded-full bg-slate-100 shadow-[0_0_40px_10px_rgba(226,232,240,0.35)]"
    />

    <!-- Clouds -->
    <template v-if="['partly-cloudy', 'cloudy', 'fog', 'drizzle', 'rain', 'heavy-rain', 'thunderstorm', 'snow', 'sleet'].includes(code)">
      <div
        class="absolute top-6 left-4 h-10 w-28 rounded-full bg-white/70 blur-[1px]"
        style="animation: wx-drift 18s ease-in-out infinite alternate"
      />
      <div
        class="absolute top-14 right-2 h-8 w-24 rounded-full bg-white/50 blur-[1px]"
        style="animation: wx-drift 24s ease-in-out infinite alternate-reverse"
      />
    </template>

    <!-- Fog bands -->
    <template v-if="code === 'fog'">
      <div
        v-for="i in 3"
        :key="'fog-' + i"
        class="absolute left-0 right-0 h-3 bg-white/40 blur-sm"
        :style="{ top: `${40 + i * 15}%`, animation: `wx-drift ${10 + i * 4}s ease-in-out infinite alternate` }"
      />
    </template>

    <!-- Rain -->
    <template v-if="['drizzle', 'rain', 'heavy-rain', 'thunderstorm'].includes(code)">
      <div
        v-for="i in 14"
        :key="'rain-' + i"
        class="absolute top-0 w-px bg-sky-100/70"
        :style="{
          height: '14px',
          left: `${(i * 7) % 100}%`,
          animation: `wx-fall ${0.6 + (i % 5) * 0.15}s linear infinite`,
          animationDelay: `${(i % 7) * 0.12}s`,
        }"
      />
    </template>

    <!-- Snow / sleet -->
    <template v-if="['snow', 'sleet'].includes(code)">
      <div
        v-for="i in 12"
        :key="'snow-' + i"
        class="absolute top-0 h-1.5 w-1.5 rounded-full bg-white/90"
        :style="{
          left: `${(i * 8.3) % 100}%`,
          animation: `wx-fall ${2.5 + (i % 4) * 0.5}s linear infinite`,
          animationDelay: `${(i % 6) * 0.3}s`,
        }"
      />
    </template>

    <!-- Lightning flash -->
    <div
      v-if="code === 'thunderstorm'"
      class="absolute inset-0 bg-white"
      style="animation: wx-flash 5s ease-in-out infinite"
    />

    <!-- Wind streaks -->
    <template v-if="code === 'windy'">
      <div
        v-for="i in 4"
        :key="'wind-' + i"
        class="absolute h-0.5 rounded-full bg-white/60"
        :style="{
          width: `${30 + i * 10}%`,
          top: `${20 + i * 18}%`,
          left: '-10%',
          animation: `wx-drift ${2 + i * 0.4}s ease-in-out infinite alternate`,
        }"
      />
    </template>
  </div>

  <!-- Compact icon glyph -->
  <div v-else class="inline-flex items-center justify-center leading-none" :style="{ fontSize: `${dims}px` }" aria-hidden="true">
    <span v-if="code === 'clear'">{{ isDay ? '☀️' : '🌙' }}</span>
    <span v-else-if="code === 'partly-cloudy'">{{ isDay ? '⛅' : '☁️' }}</span>
    <span v-else-if="code === 'cloudy'">☁️</span>
    <span v-else-if="code === 'fog'">🌫️</span>
    <span v-else-if="code === 'drizzle'">🌦️</span>
    <span v-else-if="code === 'rain'">🌧️</span>
    <span v-else-if="code === 'heavy-rain'">🌧️</span>
    <span v-else-if="code === 'thunderstorm'">⛈️</span>
    <span v-else-if="code === 'snow'">🌨️</span>
    <span v-else-if="code === 'sleet'">🌨️</span>
    <span v-else-if="code === 'windy'">💨</span>
  </div>
</template>
