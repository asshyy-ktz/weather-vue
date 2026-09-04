<script setup lang="ts">
import { onMounted } from 'vue'
import { useLocationsStore } from '@/stores/useLocationsStore'
import LocationsList from '@/components/locations/LocationsList.vue'

const locationsStore = useLocationsStore()

onMounted(async () => {
  await locationsStore.init()
})
</script>

<template>
  <div class="p-4 sm:p-6">
    <h1 class="mb-4 text-lg font-semibold text-foreground">Locations</h1>
    <LocationsList />
  </div>
</template>
