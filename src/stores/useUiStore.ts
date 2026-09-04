import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Transient, non-persisted UI state shared across views/components.
 * Persisted preferences (units, theme, dismissed alerts) live in useSettingsStore.
 */
export const useUiStore = defineStore('ui', () => {
  const isSearchOpen = ref(false)
  const searchQuery = ref('')
  const isOnline = ref(navigator.onLine)

  function openSearch() {
    isSearchOpen.value = true
  }

  function closeSearch() {
    isSearchOpen.value = false
    searchQuery.value = ''
  }

  function setOnline(value: boolean) {
    isOnline.value = value
  }

  window.addEventListener('online', () => setOnline(true))
  window.addEventListener('offline', () => setOnline(false))

  return {
    isSearchOpen,
    searchQuery,
    isOnline,
    openSearch,
    closeSearch,
    setOnline,
  }
})
