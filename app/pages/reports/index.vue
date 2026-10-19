<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { isAdmin, isRepresentative } = useAuth()
const { areaName, authorityLabel, load } = useReferenceData()
const api = useApi()

const perPage = 10
const statusFilter = ref('')
const items = ref<any[]>([])
const page = ref(1)
const total = ref(0)
const loading = ref(true)

async function fetchPage() {
  loading.value = true
  const params: Record<string, any> = { per_page: perPage, page: page.value }
  if (statusFilter.value) params['filters[status]'] = statusFilter.value
  try {
    const res = await api<{ data: any[]; total_result: number }>('/reports', { params })
    items.value = res.data
    total.value = res.total_result
  } finally {
    loading.value = false
  }
}

function applyFilter(value: string) {
  statusFilter.value = value
  page.value = 1
  fetchPage()
}

function onPage(e: { page: number }) {
  page.value = e.page + 1
  fetchPage()
}

onMounted(() => {
  load()
  fetchPage()
})
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">البلاغات</h1>
        <p class="page-sub">
          {{ isAdmin ? 'جميع البلاغات في النظام' : isRepresentative ? 'بلاغات جهتك والبلاغات التي قدّمتها' : 'البلاغات التي قدّمتها' }}
          · {{ total }}
        </p>
      </div>
      <NuxtLink v-if="!isAdmin" to="/reports/new" class="btn btn-primary"><i class="pi pi-plus" /> بلاغ جديد</NuxtLink>
    </div>

    <div class="row wrap gap-sm" style="margin-bottom: 18px">
      <button class="btn btn-sm" :class="statusFilter === '' ? 'btn-primary' : 'btn-outline'" @click="applyFilter('')">
        الكل
      </button>
      <button
        v-for="s in statusOptions"
        :key="s.value"
        class="btn btn-sm"
        :class="statusFilter === s.value ? 'btn-primary' : 'btn-outline'"
        @click="applyFilter(s.value)"
      >
        {{ s.label }}
      </button>
    </div>

    <div v-if="loading" class="list">
      <div v-for="n in 4" :key="n" class="card card-pad">
        <div class="skeleton skeleton-line" style="width: 40%" />
        <div class="skeleton skeleton-line" style="width: 70%" />
      </div>
    </div>

    <div v-else-if="!items.length" class="card empty">لا توجد بلاغات لعرضها.</div>

    <div v-else>
      <div class="list">
        <NuxtLink v-for="r in items" :key="r.id" :to="`/reports/${r.id}`" class="card card-pad card-link">
          <div class="row-between wrap">
            <div class="col" style="gap: 8px">
              <div class="row gap-sm wrap">
                <strong>{{ r.title }}</strong>
                <StatusBadge :status="r.status" />
                <PriorityBadge :priority="r.priority" />
              </div>
              <div class="meta-row">
                <span>النوع: <b>{{ reportTypeLabel(r.type) }}</b></span>
                <span>المنطقة: <b>{{ areaName(r.area_id) || '—' }}</b></span>
                <span>الجهة: <b>{{ authorityLabel(r.authority_id) || '—' }}</b></span>
                <span>{{ formatDate(r.date) }}</span>
              </div>
            </div>
            <span class="muted small">#{{ r.id }}</span>
          </div>
        </NuxtLink>
      </div>

      <Paginator
        v-if="total > perPage"
        :rows="perPage"
        :total-records="total"
        :first="(page - 1) * perPage"
        class="mt"
        @page="onPage"
      />
    </div>
  </div>
</template>
