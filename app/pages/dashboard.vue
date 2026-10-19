<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const api = useApi()
const { data, pending, error, refresh } = await useAsyncData('stats', () => api<{ data: any }>('/stats'))
const stats = computed(() => data.value?.data)

function pct(value: number, obj: Record<string, number>) {
  const max = Math.max(1, ...Object.values(obj).map(Number))
  return Math.round((Number(value) / max) * 100)
}
</script>

<template>
  <div v-if="pending" class="col gap-lg">
    <div class="grid grid-4">
      <div v-for="n in 4" :key="n" class="card card-pad"><div class="skeleton skeleton-block" style="height: 56px" /></div>
    </div>
    <div class="grid grid-3">
      <div v-for="n in 3" :key="n" class="card card-pad"><div class="skeleton skeleton-block" style="height: 180px" /></div>
    </div>
  </div>

  <div v-else-if="stats" class="col gap-lg">
    <div class="page-head">
      <div>
        <h1 class="page-title">لوحة التحكم</h1>
        <p class="page-sub">نظرة عامة على البلاغات في النظام</p>
      </div>
    </div>

    <div class="grid grid-4">
      <div class="card stat">
        <div class="stat-icon"><i class="pi pi-flag" /></div>
        <div>
          <div class="stat-label">إجمالي البلاغات</div>
          <div class="stat-value">{{ stats.totals.reports }}</div>
        </div>
      </div>
      <div class="card stat">
        <div class="stat-icon" style="background: var(--warning-soft); color: var(--warning)"><i class="pi pi-clock" /></div>
        <div>
          <div class="stat-label">بلاغات مفتوحة</div>
          <div class="stat-value">{{ stats.totals.open_reports }}</div>
        </div>
      </div>
      <div class="card stat">
        <div class="stat-icon" style="background: var(--success-soft); color: var(--success)"><i class="pi pi-building" /></div>
        <div>
          <div class="stat-label">الجهات</div>
          <div class="stat-value">{{ stats.totals.authorities }}</div>
        </div>
      </div>
      <div class="card stat">
        <div class="stat-icon"><i class="pi pi-users" /></div>
        <div>
          <div class="stat-label">المستخدمون</div>
          <div class="stat-value">{{ stats.totals.users }}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-3">
      <div class="card card-pad">
        <h3 style="margin-bottom: 16px">البلاغات حسب الحالة</h3>
        <div class="col" style="gap: 12px">
          <div v-for="s in statusOptions" :key="s.value">
            <div class="row-between small" style="margin-bottom: 4px">
              <span>{{ s.label }}</span><b>{{ stats.reports_by_status[s.value] ?? 0 }}</b>
            </div>
            <div class="bar">
              <div class="bar-fill" :style="{ width: pct(stats.reports_by_status[s.value] ?? 0, stats.reports_by_status) + '%' }" />
            </div>
          </div>
        </div>
      </div>

      <div class="card card-pad">
        <h3 style="margin-bottom: 16px">البلاغات حسب الأولوية</h3>
        <div class="col" style="gap: 12px">
          <div v-for="p in priorityOptions" :key="p.value">
            <div class="row-between small" style="margin-bottom: 4px">
              <span>{{ p.label }}</span><b>{{ stats.reports_by_priority[p.value] ?? 0 }}</b>
            </div>
            <div class="bar">
              <div class="bar-fill" :style="{ width: pct(stats.reports_by_priority[p.value] ?? 0, stats.reports_by_priority) + '%' }" />
            </div>
          </div>
        </div>
      </div>

      <div class="card card-pad">
        <h3 style="margin-bottom: 16px">البلاغات حسب النوع</h3>
        <div class="col" style="gap: 12px">
          <div v-for="t in reportTypeOptions" :key="t.value">
            <div class="row-between small" style="margin-bottom: 4px">
              <span>{{ t.label }}</span><b>{{ stats.reports_by_type[t.value] ?? 0 }}</b>
            </div>
            <div class="bar">
              <div class="bar-fill" :style="{ width: pct(stats.reports_by_type[t.value] ?? 0, stats.reports_by_type) + '%' }" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card card-pad">
        <h3 style="margin-bottom: 4px">حسب المحافظة</h3>
        <p class="muted small" style="margin-bottom: 14px">
          {{ stats.totals.cities }} محافظة · {{ stats.totals.areas }} منطقة · {{ stats.totals.authorities }} جهة
        </p>
        <div v-if="!stats.reports_by_city.length" class="muted small">لا توجد بيانات بعد.</div>
        <div v-else class="col" style="gap: 10px">
          <div v-for="c in stats.reports_by_city" :key="c.city_id" class="row-between">
            <span>{{ c.city }}</span><b>{{ c.total }}</b>
          </div>
        </div>
      </div>

      <div class="card card-pad">
        <h3 style="margin-bottom: 16px">أحدث البلاغات</h3>
        <div v-if="!stats.recent_reports.length" class="muted small">لا توجد بلاغات بعد.</div>
        <div v-else class="list">
          <NuxtLink
            v-for="r in stats.recent_reports"
            :key="r.id"
            :to="`/reports/${r.id}`"
            class="row-between"
            style="padding: 10px 0; border-bottom: 1px solid var(--border)"
          >
            <span class="grow">{{ r.title }}</span>
            <StatusBadge :status="r.status" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="card card-pad center">
    <p class="muted">تعذّر تحميل بيانات لوحة التحكم.</p>
    <button class="btn btn-outline btn-sm mt" @click="() => refresh()">إعادة المحاولة</button>
  </div>
</template>
