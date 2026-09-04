<script setup lang="ts">
import { ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useLocationsStore } from '@/stores/useLocationsStore'
import type { GeocodeResult } from '@/services/weatherService'

const emit = defineEmits<{ added: [string] }>()

const locationsStore = useLocationsStore()
const query = ref('')
const debouncedQuery = refDebounced(query, 300)
const results = ref<GeocodeResult[]>([])
const searching = ref(false)
const open = ref(false)

watch(debouncedQuery, async (q) => {
  if (!q.trim()) {
    results.value = []
    return
  }
  searching.value = true
  try {
    results.value = await locationsStore.search(q)
  } finally {
    searching.value = false
  }
})

async function select(result: GeocodeResult) {
  const saved = await locationsStore.addLocation(result)
  query.value = ''
  results.value = []
  open.value = false
  emit('added', saved.id)
}
</script>

<template>
  <div class="relative">
    <div class="flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 py-2">
      <svg class="h-4 w-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="7" />
        <path stroke-linecap="round" d="m20 20-3-3" />
      </svg>
      <input
        v-model="query"
        type="text"
        placeholder="Search for a city…"
        class="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        @focus="open = true"
      />
    </div>

    <div
      v-if="open && (results.length || searching)"
      class="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
    >
      <p v-if="searching" class="px-3 py-2.5 text-xs text-muted-foreground">Searching…</p>
      <button
        v-for="result in results"
        :key="`${result.name}-${result.lat}-${result.lon}`"
        type="button"
        class="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent"
        @click="select(result)"
      >
        <span class="text-foreground">{{ result.name }}</span>
        <span class="text-xs text-muted-foreground">{{ result.region ? `${result.region}, ` : '' }}{{ result.country }}</span>
      </button>
    </div>
    <div v-if="open" class="fixed inset-0 z-0" @click="open = false" />
  </div>
</template>
