<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const api = useApi()
const unread = useState<number>('notif_unread', () => 0)

const page = ref(1)
const perPage = 15

const { data, pending, refresh } = await useAsyncData(
  'notifications',
  () =>
    api<{ data: any[]; total_result: number; meta: { unread_count: number } }>('/notifications', {
      params: { per_page: perPage, page: page.value },
    }),
  { watch: [page] },
)
const notifications = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.total_result ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / perPage)))

watchEffect(() => {
  if (data.value?.meta) unread.value = data.value.meta.unread_count
})

async function open(n: any) {
  if (!n.read_at) {
    try {
      await api(`/notifications/${n.id}/read`, { method: 'POST' })
    } catch {
      // ignore
    }
  }
  const reportId = n.data?.report_id
  if (reportId) {
    await navigateTo(`/reports/${reportId}`)
  } else {
    await refresh()
  }
}

async function markAll() {
  await api('/notifications/read-all', { method: 'POST' })
  await refresh()
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">الإشعارات</h1>
        <p class="page-sub">{{ unread }} إشعار غير مقروء · {{ total }} إجمالاً</p>
      </div>
      <button class="btn btn-outline btn-sm" :disabled="!unread" @click="markAll">تعليم الكل كمقروء</button>
    </div>

    <div v-if="pending" class="loading"><span class="spinner" /></div>
    <div v-else-if="!notifications.length" class="card empty">لا توجد إشعارات.</div>
    <template v-else>
      <div class="list">
        <button
          v-for="n in notifications"
          :key="n.id"
          class="card card-pad card-link"
          style="text-align: start; cursor: pointer"
          :style="{
            borderInlineStartWidth: n.read_at ? '1px' : '4px',
            borderInlineStartColor: n.read_at ? 'var(--border)' : 'var(--primary)',
          }"
          @click="open(n)"
        >
          <div class="row-between">
            <span :style="{ fontWeight: n.read_at ? 400 : 700 }">{{ n.data?.message }}</span>
            <span class="muted small">{{ formatDate(n.created_at) }}</span>
          </div>
        </button>
      </div>

      <div v-if="totalPages > 1" class="row-between mt-lg">
        <button class="btn btn-outline btn-sm" :disabled="page <= 1" @click="page--">
          <i class="pi pi-angle-right" /> السابق
        </button>
        <span class="muted small">صفحة {{ page }} من {{ totalPages }}</span>
        <button class="btn btn-outline btn-sm" :disabled="page >= totalPages" @click="page++">
          التالي <i class="pi pi-angle-left" />
        </button>
      </div>
    </template>
  </div>
</template>
