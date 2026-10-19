<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    lat?: string | number | null
    lng?: string | number | null
    readonly?: boolean
    height?: string
  }>(),
  { height: '320px' },
)
const emit = defineEmits<{ update: [{ lat: string; lng: string }] }>()

const el = ref<HTMLElement | null>(null)
const locating = ref(false)
let L: any = null
let map: any = null
let marker: any = null

// Roughly centres Syria when no point is selected yet.
const SYRIA_CENTER: [number, number] = [34.8, 38.0]

function pinIcon() {
  return L.divIcon({
    className: 'map-pin',
    html: '<div class="map-pin-inner">📍</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 30],
  })
}

function setMarker(lat: number, lng: number, pan = false) {
  if (!L || !map || Number.isNaN(lat) || Number.isNaN(lng)) return
  if (!marker) {
    marker = L.marker([lat, lng], { icon: pinIcon(), draggable: !props.readonly }).addTo(map)
    if (!props.readonly) {
      marker.on('dragend', () => {
        const p = marker.getLatLng()
        emit('update', { lat: p.lat.toFixed(6), lng: p.lng.toFixed(6) })
      })
    }
  } else {
    marker.setLatLng([lat, lng])
  }
  if (pan) map.setView([lat, lng], Math.max(map.getZoom(), 14))
}

function locate() {
  if (!import.meta.client || !navigator.geolocation) return
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords
      setMarker(latitude, longitude, true)
      emit('update', { lat: latitude.toFixed(6), lng: longitude.toFixed(6) })
      locating.value = false
    },
    () => {
      locating.value = false
    },
    { enableHighAccuracy: true, timeout: 10000 },
  )
}

onMounted(async () => {
  const mod = await import('leaflet')
  L = mod.default ?? mod

  const hasPoint = props.lat != null && props.lng != null && props.lat !== '' && props.lng !== ''
  map = L.map(el.value!, { attributionControl: true }).setView(
    hasPoint ? [Number(props.lat), Number(props.lng)] : SYRIA_CENTER,
    hasPoint ? 14 : 6,
  )
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  }).addTo(map)

  if (hasPoint) setMarker(Number(props.lat), Number(props.lng))

  if (!props.readonly) {
    map.on('click', (e: any) => {
      setMarker(e.latlng.lat, e.latlng.lng)
      emit('update', { lat: e.latlng.lat.toFixed(6), lng: e.latlng.lng.toFixed(6) })
    })
  }

  setTimeout(() => map && map.invalidateSize(), 150)
})

watch(
  () => [props.lat, props.lng],
  ([lat, lng]) => {
    if (lat != null && lng != null && lat !== '' && lng !== '' && map) {
      setMarker(Number(lat), Number(lng))
    }
  },
)

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="map-wrap" :style="{ height }">
    <div ref="el" class="map" />
    <button
      v-if="!readonly"
      type="button"
      class="btn btn-sm map-locate"
      :disabled="locating"
      @click="locate"
    >
      <span v-if="locating" class="spinner" /> 📍 موقعي
    </button>
  </div>
</template>

<style scoped>
.map-wrap {
  position: relative;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border);
  /* Trap Leaflet's high internal z-indexes so form dropdowns overlay the map. */
  isolation: isolate;
}
.map {
  width: 100%;
  height: 100%;
}
.map-locate {
  position: absolute;
  top: 10px;
  inset-inline-end: 10px;
  z-index: 500;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}
</style>
