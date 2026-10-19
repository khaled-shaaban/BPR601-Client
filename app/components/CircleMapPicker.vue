<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    lat?: string | number | null
    lng?: string | number | null
    radius?: number | null // metres
    height?: string
  }>(),
  { height: '340px' },
)
const emit = defineEmits<{ update: [{ lat: string; lng: string; radius: number }] }>()

const el = ref<HTMLElement | null>(null)
const radiusKm = ref(props.radius ? Math.max(1, Math.round(props.radius / 1000)) : 25)
let L: any = null
let map: any = null
let marker: any = null
let circle: any = null
let brand = '#00332e'

// Roughly centres Syria when nothing is selected yet.
const SYRIA_CENTER: [number, number] = [34.8, 38.0]

function pinIcon() {
  return L.divIcon({
    className: 'map-pin',
    html: '<div class="map-pin-inner">📍</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 30],
  })
}

function emitUpdate() {
  if (!marker) return
  const p = marker.getLatLng()
  emit('update', { lat: p.lat.toFixed(6), lng: p.lng.toFixed(6), radius: radiusKm.value * 1000 })
}

function setCenter(lat: number, lng: number, fit = false) {
  if (!L || !map || Number.isNaN(lat) || Number.isNaN(lng)) return
  if (!marker) {
    marker = L.marker([lat, lng], { icon: pinIcon(), draggable: true }).addTo(map)
    marker.on('drag', () => circle && circle.setLatLng(marker.getLatLng()))
    marker.on('dragend', emitUpdate)
  } else {
    marker.setLatLng([lat, lng])
  }
  if (!circle) {
    circle = L.circle([lat, lng], {
      radius: radiusKm.value * 1000,
      color: brand,
      fillColor: brand,
      fillOpacity: 0.14,
      weight: 2,
    }).addTo(map)
  } else {
    circle.setLatLng([lat, lng])
  }
  if (fit) map.fitBounds(circle.getBounds(), { padding: [24, 24] })
}

watch(radiusKm, () => {
  if (circle) circle.setRadius(radiusKm.value * 1000)
  emitUpdate()
})

onMounted(async () => {
  const mod = await import('leaflet')
  L = mod.default ?? mod
  brand = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || brand

  const hasPoint = props.lat != null && props.lng != null && props.lat !== '' && props.lng !== ''
  map = L.map(el.value!, { attributionControl: true }).setView(
    hasPoint ? [Number(props.lat), Number(props.lng)] : SYRIA_CENTER,
    hasPoint ? 9 : 6,
  )
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  }).addTo(map)

  if (hasPoint) setCenter(Number(props.lat), Number(props.lng), true)

  map.on('click', (e: any) => {
    setCenter(e.latlng.lat, e.latlng.lng)
    emitUpdate()
  })

  setTimeout(() => map && map.invalidateSize(), 150)
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div>
    <div class="map-wrap" :style="{ height }">
      <div ref="el" class="map" />
    </div>
    <div class="radius-row">
      <span class="muted small" style="white-space: nowrap">نصف قطر التغطية</span>
      <input v-model.number="radiusKm" type="range" min="1" max="150" step="1" class="radius-range" />
      <b class="radius-val">{{ radiusKm }} كم</b>
    </div>
    <p class="hint" style="margin-top: 4px">انقر على الخريطة لتحديد مركز المحافظة، ثم اضبط نصف قطر الدائرة لتغطية مساحتها.</p>
  </div>
</template>

<style scoped>
.map-wrap { position: relative; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border); isolation: isolate; }
.map { width: 100%; height: 100%; }
.radius-row { display: flex; align-items: center; gap: 12px; margin-top: 10px; }
.radius-range { flex: 1; accent-color: var(--primary); }
.radius-val { white-space: nowrap; min-width: 54px; }
</style>
