<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import { useLocationsStore } from '@/stores/useLocationsStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import Sidebar from '@/components/layout/Sidebar.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import OfflineBanner from '@/components/shared/OfflineBanner.vue'

const locationsStore = useLocationsStore()
useSettingsStore() // instantiate early so dark-mode class applies immediately

const isDesktop = useMediaQuery('(min-width: 1024px)')

onMounted(async () => {
  await locationsStore.init()
})
</script>

<template>
  <div class="flex h-screen flex-col bg-background lg:flex-row">
    <aside v-if="isDesktop" class="sticky top-0 h-screen w-64 shrink-0 border-r border-border bg-card">
      <Sidebar />
    </aside>

    <div class="flex min-h-0 flex-1 flex-col">
      <OfflineBanner />

      <main class="min-h-0 flex-1 overflow-y-auto pb-16 lg:pb-0">
        <RouterView />
      </main>

      <div v-if="!isDesktop" class="sticky bottom-0">
        <BottomNav />
      </div>
    </div>
  </div>
</template>
