<script setup lang="ts">
// Named AppSwitch (not ToggleSwitch) to avoid colliding with PrimeVue's
// globally-registered ToggleSwitch component.
const model = defineModel<boolean>({ default: false })
defineProps<{ label?: string }>()
</script>

<template>
  <label class="toggle">
    <span class="switch">
      <input v-model="model" type="checkbox" />
      <span class="switch-track"><span class="switch-thumb" /></span>
    </span>
    <span v-if="label" class="toggle-label">{{ label }}</span>
  </label>
</template>

<style scoped>
.toggle { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; margin: 6px 0; }
.toggle-label { font-size: 0.9rem; font-weight: 500; }
</style>
