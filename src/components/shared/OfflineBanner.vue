<script setup lang="ts">
import { useOnline } from '@vueuse/core'

const online = useOnline()
</script>

<template>
  <div
    v-if="!online"
    class="flex items-center justify-center gap-2 bg-warning/15 px-4 py-2 text-xs font-medium text-warning"
  >
    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 18h.01M8.5 15.5a5 5 0 0 1 7 0M5.5 12.5a9 9 0 0 1 13 0M2.5 9.5a13 13 0 0 1 19 0M2 2l20 20"
      />
    </svg>
    You're offline — showing the last cached forecasts.
  </div>
</template>
