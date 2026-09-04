<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { WeatherAlert } from '@/types/weather'

const props = defineProps<{ alerts: WeatherAlert[] }>()
const settings = useSettingsStore()

const visibleAlerts = computed(() => props.alerts.filter((a) => !settings.isAlertDismissed(a.id)))

const severityStyles: Record<WeatherAlert['severity'], string> = {
  warning: 'bg-destructive/15 border-destructive/40 text-destructive',
  watch: 'bg-warning/15 border-warning/40 text-warning',
  advisory: 'bg-primary/10 border-primary/30 text-primary',
}
</script>

<template>
  <div v-if="visibleAlerts.length" class="space-y-2">
    <div
      v-for="alert in visibleAlerts"
      :key="alert.id"
      class="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
      :class="severityStyles[alert.severity]"
      role="alert"
    >
      <svg class="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
        />
      </svg>
      <div class="min-w-0 flex-1">
        <p class="font-semibold">{{ alert.title }}</p>
        <p class="mt-0.5 text-[13px] opacity-90">{{ alert.description }}</p>
        <p class="mt-1 text-[11px] uppercase tracking-wide opacity-70">{{ alert.areas }}</p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-md p-1 text-current/70 hover:bg-black/10 dark:hover:bg-white/10"
        aria-label="Dismiss alert"
        @click="settings.dismissAlert(alert.id)"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>
