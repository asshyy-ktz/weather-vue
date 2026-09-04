<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMediaQuery, useSwipe } from '@vueuse/core'
import { useLocationsStore } from '@/stores/useLocationsStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import CurrentConditionsCard from '@/components/weather/CurrentConditionsCard.vue'
import HourlyForecastRow from '@/components/weather/HourlyForecastRow.vue'
import DailyForecastList from '@/components/weather/DailyForecastList.vue'
import AlertsBanner from '@/components/alerts/AlertsBanner.vue'
import CompactWeatherCard from '@/components/weather/CompactWeatherCard.vue'
import LocationSearch from '@/components/locations/LocationSearch.vue'
import CurrentLocationCard from '@/components/locations/CurrentLocationCard.vue'

const props = defineProps<{ id?: string }>()

const route = useRoute()
const router = useRouter()
const locationsStore = useLocationsStore()
const settings = useSettingsStore()

const isDesktop = useMediaQuery('(min-width: 1024px)')

const orderedLocations = computed(() => locationsStore.sortedLocations)

const activeId = computed(() => (props.id as string) || (route.params.id as string) || settings.selectedLocationId || orderedLocations.value[0]?.id || null)

const activeIndex = computed(() => orderedLocations.value.findIndex((l) => l.id === activeId.value))
const activeLocation = computed(() => orderedLocations.value[activeIndex.value] ?? orderedLocations.value[0])
const activeForecast = computed(() => (activeLocation.value ? locationsStore.forecastFor(activeLocation.value.id) : undefined))

async function selectLocation(id: string) {
  settings.selectLocation(id)
  await locationsStore.ensureForecast(id)
  router.replace({ name: 'forecast-location', params: { id } })
}

onMounted(async () => {
  await locationsStore.init()
  if (activeLocation.value) await selectLocation(activeLocation.value.id)
})

watch(
  () => activeLocation.value?.id,
  async (id) => {
    if (id) await locationsStore.ensureForecast(id)
  },
)

// ---------- Mobile swipe between saved locations ----------
const swipeTarget = ref<HTMLElement | null>(null)
useSwipe(swipeTarget, {
  onSwipeEnd(_e, direction) {
    if (isDesktop.value || orderedLocations.value.length < 2) return
    const currentIndex = activeIndex.value
    if (direction === 'left' && currentIndex < orderedLocations.value.length - 1) {
      void selectLocation(orderedLocations.value[currentIndex + 1].id)
    } else if (direction === 'right' && currentIndex > 0) {
      void selectLocation(orderedLocations.value[currentIndex - 1].id)
    }
  },
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col lg:flex-row">
    <!-- Desktop: locations list rail -->
    <aside v-if="isDesktop" class="w-80 shrink-0 overflow-y-auto border-r border-border p-4">
      <LocationSearch @added="selectLocation" />
      <div class="mt-4">
        <CurrentLocationCard @open="selectLocation" />
      </div>
      <h3 class="mb-2 mt-4 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Saved locations
      </h3>
      <ul class="space-y-2">
        <li v-for="loc in locationsStore.savedOnly" :key="loc.id">
          <CompactWeatherCard
            :location="loc"
            :forecast="locationsStore.forecastFor(loc.id)"
            :selected="activeLocation?.id === loc.id"
            @click="selectLocation(loc.id)"
          />
        </li>
      </ul>
    </aside>

    <!-- Detail panel -->
    <div ref="swipeTarget" class="min-h-0 flex-1 overflow-y-auto">
      <div v-if="!activeLocation" class="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p class="text-sm text-muted-foreground">
          No locations yet. Search for a city to get started.
        </p>
        <div class="w-full max-w-sm">
          <LocationSearch @added="selectLocation" />
        </div>
      </div>

      <div v-else class="space-y-4 p-4 sm:p-6">
        <div v-if="!isDesktop && orderedLocations.length > 1" class="flex items-center justify-center gap-1.5">
          <span
            v-for="loc in orderedLocations"
            :key="loc.id"
            class="h-1.5 rounded-full transition-all"
            :class="loc.id === activeLocation?.id ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30'"
          />
        </div>

        <AlertsBanner v-if="activeForecast" :alerts="activeForecast.alerts" />

        <CurrentConditionsCard
          :location="activeLocation"
          :forecast="activeForecast"
          :loading="locationsStore.isLoading(activeLocation.id)"
        />

        <HourlyForecastRow v-if="activeForecast" :hours="activeForecast.hourly" />
        <DailyForecastList v-if="activeForecast" :days="activeForecast.daily" />

        <p v-if="!isDesktop && orderedLocations.length > 1" class="text-center text-xs text-muted-foreground">
          Swipe left or right to switch locations
        </p>
      </div>
    </div>
  </div>
</template>
