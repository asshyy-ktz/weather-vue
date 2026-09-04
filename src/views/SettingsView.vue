<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useLocationsStore } from '@/stores/useLocationsStore'
import UnitToggle from '@/components/shared/UnitToggle.vue'
import DarkModeToggle from '@/components/shared/DarkModeToggle.vue'

const settings = useSettingsStore()
const locationsStore = useLocationsStore()

const themeLabel = computed(() => {
  switch (settings.darkModePreference) {
    case 'light':
      return 'Light'
    case 'dark':
      return 'Dark'
    default:
      return 'System'
  }
})
</script>

<template>
  <div class="mx-auto max-w-xl space-y-6 p-4 sm:p-6">
    <h1 class="text-lg font-semibold text-foreground">Settings</h1>

    <section class="space-y-3 rounded-2xl border border-border bg-card p-4">
      <h2 class="text-sm font-semibold text-muted-foreground">Units</h2>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-foreground">Temperature unit</p>
          <p class="text-xs text-muted-foreground">Applies across forecasts, radar, and saved locations.</p>
        </div>
        <UnitToggle />
      </div>
    </section>

    <section class="space-y-3 rounded-2xl border border-border bg-card p-4">
      <h2 class="text-sm font-semibold text-muted-foreground">Appearance</h2>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-foreground">Theme</p>
          <p class="text-xs text-muted-foreground">Currently following: {{ themeLabel }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            @click="settings.cycleTheme()"
          >
            Cycle: {{ themeLabel }}
          </button>
          <DarkModeToggle />
        </div>
      </div>
    </section>

    <section class="space-y-3 rounded-2xl border border-border bg-card p-4">
      <h2 class="text-sm font-semibold text-muted-foreground">Alerts</h2>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-foreground">Dismissed alerts</p>
          <p class="text-xs text-muted-foreground">
            {{ settings.dismissedAlertIds.length }} dismissed. Clearing lets them reappear if still active.
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-40"
          :disabled="!settings.dismissedAlertIds.length"
          @click="settings.dismissedAlertIds = []"
        >
          Clear
        </button>
      </div>
    </section>

    <section class="space-y-3 rounded-2xl border border-border bg-card p-4">
      <h2 class="text-sm font-semibold text-muted-foreground">Data</h2>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-foreground">Saved locations</p>
          <p class="text-xs text-muted-foreground">
            {{ locationsStore.savedOnly.length }} saved, cached locally for offline use.
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-40"
          :disabled="!navigator.onLine"
          @click="locationsStore.refreshAll()"
        >
          Refresh all
        </button>
      </div>
    </section>
  </div>
</template>
