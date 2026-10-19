<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { isAdmin } = useAuth()
await navigateTo(isAdmin.value ? '/dashboard' : '/reports', { replace: true })
</script>

<template>
  <div class="loading"><span class="spinner" /></div>
</template>
