<script setup lang="ts">
const { theme, toggle: toggleTheme } = useTheme()
</script>

<template>
  <div class="auth-wrap">
    <button
      class="icon-btn auth-theme-toggle"
      :title="theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'"
      @click="toggleTheme"
    >
      <i :class="theme === 'dark' ? 'pi pi-sun' : 'pi pi-moon'" />
    </button>
    <div class="auth-card">
      <div class="auth-logo">
        <div class="brand">🛡️ منصة البلاغات</div>
      </div>
      <slot />
    </div>
    <Toaster />
  </div>
</template>
