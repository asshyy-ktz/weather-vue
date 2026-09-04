<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { SavedLocation } from '@/types/weather'

const props = defineProps<{
  locations: SavedLocation[]
  activeLocationId?: string | null
}>()

const settings = useSettingsStore()
const mapEl = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let markers: L.Marker[] = []
let precipLayer: L.LayerGroup | null = null
let animationFrame: number | null = null

/** Fixed default icon paths break under bundlers — point them at CDN assets. */
const icon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function buildMockPrecipCells(center: L.LatLng, seed: number): L.Circle[] {
  const cells: L.Circle[] = []
  const rand = mulberry(seed)
  const count = 5 + Math.floor(rand() * 4)
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2
    const dist = rand() * 2.5
    const lat = center.lat + Math.sin(angle) * dist
    const lng = center.lng + Math.cos(angle) * dist * 1.4
    const intensity = rand()
    const color = intensity > 0.66 ? '#dc2626' : intensity > 0.33 ? '#f59e0b' : '#3b82f6'
    cells.push(
      L.circle([lat, lng], {
        radius: (20000 + rand() * 60000) * (0.5 + intensity),
        color,
        fillColor: color,
        fillOpacity: 0.28,
        weight: 0,
        className: 'precip-cell',
      }),
    )
  }
  return cells
}

function mulberry(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function renderMarkers() {
  if (!map) return
  markers.forEach((m) => m.remove())
  markers = props.locations.map((loc) => {
    const marker = L.marker([loc.lat, loc.lon], { icon }).addTo(map as L.Map)
    marker.bindPopup(`<strong>${loc.name}</strong><br/>${loc.country}`)
    return marker
  })
}

function renderPrecipLayer() {
  if (!map) return
  precipLayer?.remove()
  precipLayer = L.layerGroup()
  const focus = props.locations.find((l) => l.id === props.activeLocationId) ?? props.locations[0]
  if (focus) {
    const seed = Math.floor(focus.lat * 1000) ^ Math.floor(focus.lon * 1000)
    buildMockPrecipCells(L.latLng(focus.lat, focus.lon), seed).forEach((cell) => precipLayer?.addLayer(cell))
  }
  precipLayer.addTo(map)
}

function animatePrecip() {
  if (!precipLayer) return
  const t = Date.now() / 1000
  precipLayer.eachLayer((layer) => {
    if (layer instanceof L.Circle) {
      const id = (layer as unknown as { _leaflet_id: number })._leaflet_id
      layer.setStyle({ fillOpacity: 0.18 + Math.abs(Math.sin(t * 0.4 + id)) * 0.18 })
    }
  })
  animationFrame = requestAnimationFrame(animatePrecip)
}

function focusLocation() {
  if (!map) return
  const focus = props.locations.find((l) => l.id === props.activeLocationId) ?? props.locations[0]
  if (focus) map.setView([focus.lat, focus.lon], 6)
}

onMounted(() => {
  if (!mapEl.value) return
  map = L.map(mapEl.value, { zoomControl: true, attributionControl: true }).setView([20, 0], 2)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  renderMarkers()
  renderPrecipLayer()
  focusLocation()
  animationFrame = requestAnimationFrame(animatePrecip)
})

watch(() => props.locations.map((l) => l.id).join(','), renderMarkers)
watch(
  () => props.activeLocationId,
  () => {
    renderPrecipLayer()
    focusLocation()
  },
)
void settings // keep dark-mode reactivity dependency for tile filter (handled in CSS)

onBeforeUnmount(() => {
  if (animationFrame) cancelAnimationFrame(animationFrame)
  map?.remove()
  map = null
})
</script>

<template>
  <div class="relative h-full w-full overflow-hidden rounded-2xl border border-border">
    <div ref="mapEl" class="h-full w-full" />
    <div
      class="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-card/90 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow"
    >
      Mock radar overlay — precipitation intensity is simulated, not live data.
    </div>
  </div>
</template>
