<script setup lang="ts">
definePageMeta({
  middleware: [
    'auth',
    () => {
      const { isAdmin } = useAuth()
      if (isAdmin.value) return navigateTo('/reports')
    },
  ],
})

const api = useApi()
const toast = useToast()
const { cities, areas, authorities, load, cityName, authorityLabel } = useReferenceData()
await load()

const form = reactive({
  title: '',
  description: '',
  type: '',
  priority: 'medium',
  area_id: '' as string | number,
  authority_id: '' as string | number,
  latitude: '',
  longitude: '',
  date: new Date().toISOString().slice(0, 16),
})

const files = ref<File[]>([])
const error = ref('')
const loading = ref(false)

const areaOptions = computed(() =>
  [...areas.value]
    .sort((a, b) => a.city_id - b.city_id || a.name.localeCompare(b.name))
    .map((a) => ({ value: a.id, label: `${cityName(a.city_id)} — ${a.name}` })),
)
// Governorate/region filters to narrow down the authority list.
const authGov = ref<string | number>('')
const authRegion = ref<string | number>('')
const govOptions = computed(() => cities.value.map((c) => ({ value: c.id, label: c.name })))
const authRegionOptions = computed(() =>
  areas.value
    .filter((a) => !authGov.value || a.city_id === authGov.value)
    .map((a) => ({ value: a.id, label: a.name })),
)
const authorityOptions = computed(() => {
  let list = [...authorities.value]
  if (authRegion.value) list = list.filter((a) => a.area_id === authRegion.value)
  else if (authGov.value) list = list.filter((a) => areas.value.find((x) => x.id === a.area_id)?.city_id === authGov.value)
  return list
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => ({ value: a.id, label: authorityLabel(a.id) }))
})
watch(authGov, () => {
  if (authRegion.value && areas.value.find((a) => a.id === authRegion.value)?.city_id !== authGov.value) authRegion.value = ''
  if (form.authority_id && !authorityOptions.value.some((o) => o.value === form.authority_id)) form.authority_id = ''
})
watch(authRegion, () => {
  if (form.authority_id && !authorityOptions.value.some((o) => o.value === form.authority_id)) form.authority_id = ''
})

function onPick(c: { lat: string; lng: string }) {
  form.latitude = c.lat
  form.longitude = c.lng
}

function onFiles(e: Event) {
  const list = (e.target as HTMLInputElement).files
  if (list) files.value.push(...Array.from(list))
  ;(e.target as HTMLInputElement).value = ''
}
function removeFile(i: number) {
  files.value.splice(i, 1)
}

async function submit() {
  error.value = ''
  if (!form.latitude || !form.longitude) {
    error.value = 'يرجى تحديد موقع الحادثة على الخريطة.'
    return
  }
  loading.value = true
  try {
    const payload = { ...form, date: new Date(form.date).toISOString() }
    const res = await api<{ data: { id: number } }>('/reports', { method: 'POST', body: payload })
    const id = res.data.id

    if (files.value.length) {
      const fd = new FormData()
      files.value.forEach((f) => fd.append('files[]', f))
      try {
        await api(`/reports/${id}/media`, { method: 'POST', body: fd })
      } catch {
        toast.error('تم إنشاء البلاغ لكن تعذّر رفع بعض المرفقات.')
      }
    }

    toast.success('تم إرسال البلاغ بنجاح.')
    await navigateTo(`/reports/${id}`)
  } catch (e: any) {
    const errors = e?.data?.errors as Record<string, string[]> | undefined
    error.value = errors
      ? Object.values(errors)[0]?.[0] ?? 'تعذّر إنشاء البلاغ.'
      : e?.data?.message || 'تعذّر إنشاء البلاغ.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">بلاغ جديد</h1>
        <p class="page-sub">عبّئ تفاصيل الحادثة لإرسالها إلى الجهة المختصة</p>
      </div>
      <NuxtLink to="/reports" class="btn btn-outline btn-sm">رجوع</NuxtLink>
    </div>

    <form class="card card-pad" style="max-width: 760px" @submit.prevent="submit">
      <div v-if="error" class="alert alert-error" style="margin-bottom: 18px">{{ error }}</div>

      <div class="field">
        <label class="label">عنوان البلاغ</label>
        <input v-model="form.title" class="input" type="text" maxlength="255" required />
      </div>

      <div class="grid grid-2">
        <div class="field">
          <label class="label">نوع البلاغ</label>
          <select v-model="form.type" class="select" required>
            <option value="" disabled>اختر النوع</option>
            <option v-for="t in reportTypeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>
        <div class="field">
          <label class="label">الأولوية</label>
          <select v-model="form.priority" class="select" required>
            <option v-for="p in priorityOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label class="label">المنطقة</label>
        <SearchableSelect v-model="form.area_id" :options="areaOptions" placeholder="ابحث واختر المنطقة" />
      </div>

      <div class="field">
        <label class="label">الجهة المختصة</label>
        <div class="grid grid-2" style="margin-bottom: 8px">
          <SearchableSelect v-model="authGov" :options="govOptions" placeholder="تصفية حسب المحافظة" />
          <SearchableSelect v-model="authRegion" :options="authRegionOptions" placeholder="تصفية حسب المنطقة" />
        </div>
        <SearchableSelect v-model="form.authority_id" :options="authorityOptions" placeholder="ابحث واختر الجهة" />
      </div>

      <div class="field">
        <label class="label">وقت الحادثة</label>
        <input v-model="form.date" class="input" type="datetime-local" required />
      </div>

      <div class="field">
        <label class="label">موقع الحادثة</label>
        <MapPicker :lat="form.latitude" :lng="form.longitude" @update="onPick" />
        <div class="row gap-sm" style="margin-top: 10px">
          <input v-model="form.latitude" class="input grow" placeholder="خط العرض" required />
          <input v-model="form.longitude" class="input grow" placeholder="خط الطول" required />
        </div>
        <span class="hint">انقر على الخريطة لتحديد الموقع، أو اسحب الدبوس، أو استخدم زر «موقعي».</span>
      </div>

      <div class="field">
        <label class="label">الوصف (اختياري)</label>
        <textarea v-model="form.description" class="textarea" maxlength="255" placeholder="تفاصيل إضافية" />
      </div>

      <div class="field">
        <label class="label">مرفقات (اختياري)</label>
        <label class="btn btn-outline" style="cursor: pointer; align-self: flex-start">
          + اختر ملفات
          <input type="file" multiple hidden accept="image/*,video/*,.pdf,.doc,.docx" @change="onFiles" />
        </label>
        <div v-if="files.length" class="col gap-sm" style="margin-top: 10px">
          <div
            v-for="(f, i) in files"
            :key="i"
            class="row-between card"
            style="padding: 8px 12px"
          >
            <span class="small">📎 {{ f.name }} <span class="muted">({{ formatBytes(f.size) }})</span></span>
            <button type="button" class="btn btn-ghost btn-sm" @click="removeFile(i)">✕</button>
          </div>
        </div>
      </div>

      <button class="btn btn-primary" type="submit" :disabled="loading">
        <span v-if="loading" class="spinner" />
        إرسال البلاغ
      </button>
    </form>
  </div>
</template>
