<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocationsStore } from '@/stores/useLocationsStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import RadarMap from '@/components/map/RadarMap.vue'

const route = useRoute()
const router = useRouter()
const locationsStore = useLocationsStore()
const settings = useSettingsStore()

onMounted(async () => {
  await locationsStore.init()
})

const activeId = computed(
  () => (route.query.location as string) || settings.selectedLocationId || locationsStore.sortedLocations[0]?.id || null,
)

const activeLocation = computed(() => locationsStore.locations.find((l) => l.id === activeId.value) ?? null)

function selectLocation(id: string) {
  settings.selectLocation(id)
  router.replace({ name: 'map', query: { location: id } })
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-4 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-lg font-semibold text-foreground">Radar</h1>
        <p class="text-sm text-muted-foreground">
          Simulated precipitation overlay on an OpenStreetMap base layer.
        </p>
      </div>

      <label class="flex items-center gap-2 text-sm">
        <span class="text-muted-foreground">Focus</span>
        <select
          class="rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          :value="activeId ?? ''"
          @change="selectLocation(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="loc in locationsStore.sortedLocations" :key="loc.id" :value="loc.id">
            {{ loc.name }}
          </option>
        </select>
      </label>
    </div>

    <div class="min-h-0 flex-1 overflow-hidden rounded-2xl">
      <RadarMap
        v-if="locationsStore.sortedLocations.length"
        :locations="locationsStore.sortedLocations"
        :active-location-id="activeLocation?.id"
      />
      <div
        v-else
        class="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground"
      >
        Add a location to see it on the radar.
      </div>
    </div>
  </div>
</template>
