<script setup lang="ts">
const props = defineProps<{ priority: string }>()
</script>

<template>
  <span class="badge" :class="`badge-${props.priority}`">{{ priorityLabel(props.priority) }}</span>
</template>
