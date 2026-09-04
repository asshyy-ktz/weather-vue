<script setup lang="ts">
import { RouterLink } from 'vue-router'

const links = [
  { to: '/', label: 'Forecast', icon: 'M12 3v9l4 2' },
  { to: '/map', label: 'Radar', icon: 'M9 20 3 17V4l6 3m0 13 6-3m-6 3V7m6 10 6 3V7l-6-3m0 13V4' },
  { to: '/locations', label: 'Locations', icon: 'M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z' },
  { to: '/settings', label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 1-.1 1.2l2 1.6-2 3.4-2.4-1a7.6 7.6 0 0 1-2.1 1.2l-.4 2.6H9.6l-.4-2.6a7.6 7.6 0 0 1-2.1-1.2l-2.4 1-2-3.4 2-1.6A7.4 7.4 0 0 1 4.6 12a7.4 7.4 0 0 1 .1-1.2l-2-1.6 2-3.4 2.4 1a7.6 7.6 0 0 1 2.1-1.2L9.6 3h4.8l.4 2.6a7.6 7.6 0 0 1 2.1 1.2l2.4-1 2 3.4-2 1.6c.07.4.1.79.1 1.2Z' },
]
</script>

<template>
  <nav class="safe-bottom flex items-stretch border-t border-border bg-card">
    <RouterLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      class="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground"
      active-class="!text-primary"
    >
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" :d="link.icon" />
      </svg>
      {{ link.label }}
    </RouterLink>
  </nav>
</template>
