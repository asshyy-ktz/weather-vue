<script setup lang="ts">
import { onMounted } from 'vue'
import { useLocationsStore } from '@/stores/useLocationsStore'
import { useCurrentLocation } from '@/composables/useCurrentLocation'
import CompactWeatherCard from '@/components/weather/CompactWeatherCard.vue'

const emit = defineEmits<{ open: [string] }>()

const locationsStore = useLocationsStore()
const { status, errorMessage, locate } = useCurrentLocation()

onMounted(() => {
  if (!locationsStore.currentLocationEntry) {
    void locate()
  } else {
    status.value = 'granted'
  }
})
</script>

<template>
  <div>
    <h3 class="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      Current location
    </h3>

    <CompactWeatherCard
      v-if="locationsStore.currentLocationEntry && status !== 'denied' && status !== 'unsupported'"
      :location="locationsStore.currentLocationEntry"
      :forecast="locationsStore.forecastFor(locationsStore.currentLocationEntry.id)"
      @click="emit('open', locationsStore.currentLocationEntry.id)"
    />

    <div
      v-else-if="status === 'locating'"
      class="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3.5 text-sm text-muted-foreground"
    >
      <span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      Finding your location…
    </div>

    <div
      v-else-if="status === 'denied' || status === 'unsupported' || status === 'error'"
      class="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3.5 text-sm text-muted-foreground"
    >
      <span>{{ errorMessage || 'Location unavailable.' }}</span>
      <button
        v-if="status !== 'unsupported'"
        type="button"
        class="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        @click="locate"
      >
        Retry
      </button>
    </div>

    <button
      v-else
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      @click="locate"
    >
      Use my current location
    </button>
  </div>
</template>
