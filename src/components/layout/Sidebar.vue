<script setup lang="ts">
import { RouterLink } from 'vue-router'
import UnitToggle from '@/components/shared/UnitToggle.vue'
import DarkModeToggle from '@/components/shared/DarkModeToggle.vue'

const links = [
  { to: '/', label: 'Forecast', icon: 'M12 3v9l4 2' },
  { to: '/map', label: 'Radar', icon: 'M9 20 3 17V4l6 3m0 13 6-3m-6 3V7m6 10 6 3V7l-6-3m0 13V4' },
  { to: '/locations', label: 'Locations', icon: 'M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z' },
]
</script>

<template>
  <div class="flex h-full flex-col gap-1 p-4">
    <div class="mb-4 flex items-center justify-between px-1">
      <span class="text-base font-bold text-foreground">Weather</span>
      <DarkModeToggle />
    </div>

    <RouterLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
      active-class="!bg-primary/10 !text-primary"
    >
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" :d="link.icon" />
      </svg>
      {{ link.label }}
    </RouterLink>

    <div class="mt-auto flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2.5">
      <span class="text-xs font-medium text-muted-foreground">Units</span>
      <UnitToggle />
    </div>
  </div>
</template>
