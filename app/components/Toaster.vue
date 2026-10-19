<script setup lang="ts">
const { toasts } = useToast()
const icon = (type: string) => (type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️')
</script>

<template>
  <div class="toaster">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="`toast-${t.type}`">
      <span>{{ icon(t.type) }}</span>
      <span>{{ t.message }}</span>
    </div>
  </div>
</template>
