<script setup lang="ts">
defineProps<{ title?: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal card">
      <div class="modal-head">
        <h3>{{ title }}</h3>
        <button class="btn btn-ghost btn-sm" @click="emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5);
  display: grid; place-items: center; z-index: 200; padding: 20px;
}
.modal { width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
.modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--surface);
}
.modal-body { padding: 20px; }
</style>
