<script setup lang="ts">
const props = defineProps<{ status: string }>()
</script>

<template>
  <span class="badge" :class="`badge-${props.status}`">{{ statusLabel(props.status) }}</span>
</template>
