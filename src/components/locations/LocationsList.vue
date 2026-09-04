<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLocationsStore } from '@/stores/useLocationsStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import CompactWeatherCard from '@/components/weather/CompactWeatherCard.vue'
import LocationSearch from '@/components/locations/LocationSearch.vue'
import CurrentLocationCard from '@/components/locations/CurrentLocationCard.vue'

const locationsStore = useLocationsStore()
const settings = useSettingsStore()
const router = useRouter()

const draggingId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)

function onDragStart(id: string, event: DragEvent) {
  draggingId.value = id
  event.dataTransfer?.setData('text/plain', id)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDragOver(id: string) {
  if (draggingId.value && draggingId.value !== id) dragOverId.value = id
}

async function onDrop(id: string) {
  if (draggingId.value && draggingId.value !== id) {
    await locationsStore.reorder(draggingId.value, id)
  }
  draggingId.value = null
  dragOverId.value = null
}

function onDragEnd() {
  draggingId.value = null
  dragOverId.value = null
}

function open(id: string) {
  settings.selectLocation(id)
  router.push({ name: 'forecast-location', params: { id } })
}

async function remove(id: string, event: Event) {
  event.stopPropagation()
  await locationsStore.removeLocation(id)
}
</script>

<template>
  <div class="space-y-4">
    <LocationSearch @added="open" />

    <CurrentLocationCard @open="open" />

    <div>
      <h3 class="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Saved locations
      </h3>
      <p v-if="!locationsStore.savedOnly.length" class="px-1 text-sm text-muted-foreground">
        No saved locations yet — search for a city above to add one.
      </p>
      <ul class="space-y-2">
        <li
          v-for="loc in locationsStore.savedOnly"
          :key="loc.id"
          class="group relative transition"
          :class="dragOverId === loc.id ? 'scale-[1.01]' : ''"
        >
          <CompactWeatherCard
            :location="loc"
            :forecast="locationsStore.forecastFor(loc.id)"
            :selected="settings.selectedLocationId === loc.id"
            draggable
            @click="open(loc.id)"
            @dragstart="onDragStart(loc.id, $event)"
            @dragover="onDragOver(loc.id)"
            @drop="onDrop(loc.id)"
            @dragend="onDragEnd"
          />
          <button
            type="button"
            class="absolute right-2 top-2 z-10 rounded-full bg-black/25 p-1 text-white opacity-0 transition group-hover:opacity-100"
            aria-label="Remove location"
            @click="remove(loc.id, $event)"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          <span
            class="absolute -left-1 top-1/2 hidden -translate-y-1/2 cursor-grab touch-none text-muted-foreground sm:block"
            title="Drag to reorder"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="8" cy="6" r="1.4" /><circle cx="8" cy="12" r="1.4" /><circle cx="8" cy="18" r="1.4" />
              <circle cx="14" cy="6" r="1.4" /><circle cx="14" cy="12" r="1.4" /><circle cx="14" cy="18" r="1.4" />
            </svg>
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>
