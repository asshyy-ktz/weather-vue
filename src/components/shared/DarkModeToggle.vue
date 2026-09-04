<script setup lang="ts">
import { useSettingsStore } from '@/stores/useSettingsStore'

const settings = useSettingsStore()
</script>

<template>
  <button
    type="button"
    class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition hover:text-foreground"
    :aria-label="settings.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="settings.toggleDark()"
  >
    <svg v-if="settings.isDark" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="4" />
      <path
        stroke-linecap="round"
        d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"
      />
    </svg>
    <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  </button>
</template>
