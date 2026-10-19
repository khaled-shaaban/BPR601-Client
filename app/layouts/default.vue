<script setup lang="ts">
const { user, isAdmin, isSuperAdmin, isRepresentative, logout } = useAuth()
const { theme, toggle: toggleTheme } = useTheme()
const route = useRoute()
const unread = useState<number>('notif_unread', () => 0)
const sidebarOpen = ref(false)

// Notifications via polling (no WebSocket) — primes the unread badge and
// surfaces new notifications while the user is signed in.
const realtime = useRealtime()
watch(() => user.value?.id, (id) => { if (id) realtime.start() }, { immediate: true })
onBeforeUnmount(() => realtime.stop())

// Close the mobile drawer on navigation.
watch(() => route.path, () => { sidebarOpen.value = false })

const navItems = computed(() => {
  const items: { to: string; icon: string; label: string }[] = []
  if (isAdmin.value) items.push({ to: '/dashboard', icon: 'pi pi-chart-bar', label: 'لوحة التحكم' })
  items.push({ to: '/reports', icon: 'pi pi-flag', label: 'البلاغات' })
  if (!isAdmin.value) items.push({ to: '/reports/new', icon: 'pi pi-plus-circle', label: 'بلاغ جديد' })
  if (isSuperAdmin.value) items.push({ to: '/manage', icon: 'pi pi-cog', label: 'الإدارة' })
  return items
})

const initials = computed(() => {
  const parts = (user.value?.name || '?').trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')) || '?'
})

const roleLabel = computed(() => {
  if (isSuperAdmin.value) return 'مدير عام'
  if (isAdmin.value) return 'مدير'
  if (isRepresentative.value) return 'موظف حكومي'
  return 'مستخدم'
})

function isActive(to: string) {
  if (to === '/reports') {
    return route.path === '/reports' || (route.path.startsWith('/reports/') && route.path !== '/reports/new')
  }
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-brand">🛡️ <span>منصة البلاغات</span></div>

      <nav class="sidebar-nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          :class="{ active: isActive(item.to) }"
        >
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <NuxtLink to="/profile" class="sidebar-user">
          <span class="avatar">{{ initials }}</span>
          <span class="sidebar-user-info">
            <b>{{ user?.name }}</b>
            <small>{{ roleLabel }}</small>
          </span>
        </NuxtLink>
        <button class="icon-btn" title="تسجيل الخروج" @click="logout"><i class="pi pi-sign-out" /></button>
      </div>
    </aside>

    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false" />

    <div class="app-main">
      <header class="topbar">
        <button class="icon-btn topbar-menu" title="القائمة" @click="sidebarOpen = !sidebarOpen">
          <i class="pi pi-bars" />
        </button>
        <div class="topbar-spacer" />
        <button class="icon-btn" :title="theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'" @click="toggleTheme">
          <i :class="theme === 'dark' ? 'pi pi-sun' : 'pi pi-moon'" />
        </button>
        <span v-if="isRepresentative && user?.authority" class="nav-authority" title="الجهة التي تمثّلها">
          🏛️ {{ user.authority.name }}
        </span>
        <NuxtLink
          to="/notifications"
          class="icon-btn"
          :class="{ active: route.path.startsWith('/notifications') }"
          title="الإشعارات"
        >
          <i class="pi pi-bell" />
          <span v-if="unread" class="bell-badge">{{ unread }}</span>
        </NuxtLink>
      </header>

      <main class="app-content">
        <slot />
      </main>
    </div>

    <Toaster />
  </div>
</template>
