<script setup lang="ts">
import { useSettingsStore } from '@/stores/useSettingsStore'

const settings = useSettingsStore()
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center rounded-full border border-border bg-muted p-0.5 text-xs font-semibold"
    role="switch"
    :aria-checked="settings.unit === 'fahrenheit'"
    aria-label="Toggle temperature unit"
    @click="settings.toggleUnit()"
  >
    <span
      class="rounded-full px-2.5 py-1 transition"
      :class="settings.unit === 'celsius' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'"
    >
      °C
    </span>
    <span
      class="rounded-full px-2.5 py-1 transition"
      :class="settings.unit === 'fahrenheit' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'"
    >
      °F
    </span>
  </button>
</template>
