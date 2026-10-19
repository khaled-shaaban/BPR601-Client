<script setup lang="ts">
definePageMeta({ middleware: 'super-admin' })

const api = useApi()
const toast = useToast()

const items = ref<any[]>([])
const areas = ref<any[]>([])
const cities = ref<any[]>([])
const loading = ref(true)
const modal = ref(false)
const editing = ref<any | null>(null)
const saving = ref(false)
const error = ref('')
const governorateId = ref<string | number>('')
const form = reactive({
  name: '',
  code: '',
  description: '',
  icon: '',
  color: '',
  area_id: '' as string | number,
  address: '',
  contact_phone_1: '',
  contact_phone_2: '',
  active: true,
})

const cityOptions = computed(() => cities.value.map((c) => ({ value: c.id, label: c.name })))
// The region list is filtered by the selected governorate.
const areaOptions = computed(() =>
  areas.value
    .filter((a) => !governorateId.value || a.city_id === governorateId.value)
    .map((a) => ({ value: a.id, label: a.name })),
)
const areaName = (id: number) => areas.value.find((a) => a.id === id)?.name ?? ''
// "governorate - region" for the table, so authorities are identifiable at a glance.
function regionWithGov(areaId: number) {
  const area = areas.value.find((a) => a.id === areaId)
  if (!area) return '—'
  const city = cities.value.find((c) => c.id === area.city_id)
  return [city?.name, area.name].filter(Boolean).join(' - ')
}

// A colour input needs "#RRGGBB"; the column stores the bare hex.
const colorPicker = computed({
  get: () => {
    const c = (form.color || '').replace('#', '')
    return /^[0-9a-fA-F]{6}$/.test(c) ? '#' + c : '#00332e'
  },
  set: (v: string) => {
    form.color = v.replace('#', '')
  },
})

// Clear the region if it no longer belongs to the chosen governorate.
watch(governorateId, (g) => {
  const a = areas.value.find((x) => x.id === form.area_id)
  if (a && a.city_id !== g) form.area_id = ''
})

async function loadItems() {
  loading.value = true
  try {
    const [au, ar, ci] = await Promise.all([
      api<{ data: any[] }>('/authorities', { params: { per_page: 100 } }),
      api<{ data: any[] }>('/areas', { params: { per_page: 100 } }),
      api<{ data: any[] }>('/cities', { params: { per_page: 100 } }),
    ])
    items.value = au.data
    areas.value = ar.data
    cities.value = ci.data
  } finally {
    loading.value = false
  }
}
onMounted(loadItems)

function reset() {
  Object.assign(form, {
    name: '', code: '', description: '', icon: '', color: '',
    area_id: '', address: '', contact_phone_1: '', contact_phone_2: '', active: true,
  })
  governorateId.value = ''
}

function openCreate() {
  editing.value = null
  reset()
  error.value = ''
  modal.value = true
}
function openEdit(item: any) {
  editing.value = item
  governorateId.value = areas.value.find((a) => a.id === item.area_id)?.city_id ?? ''
  Object.assign(form, {
    name: item.name ?? '',
    code: item.code ?? '',
    description: item.description ?? '',
    icon: item.icon ?? '',
    color: item.color ?? '',
    area_id: item.area_id,
    address: item.address ?? '',
    contact_phone_1: item.contact_phone_1 ?? '',
    contact_phone_2: item.contact_phone_2 ?? '',
    active: !!item.active,
  })
  error.value = ''
  modal.value = true
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    if (editing.value) await api(`/authorities/${editing.value.id}`, { method: 'PUT', body: form })
    else await api('/authorities', { method: 'POST', body: form })
    modal.value = false
    toast.success('تم الحفظ.')
    await loadItems()
  } catch (e: any) {
    const errs = e?.data?.errors as Record<string, string[]> | undefined
    error.value = errs ? Object.values(errs)[0]?.[0] ?? 'تعذّر الحفظ.' : e?.data?.message || 'تعذّر الحفظ.'
  } finally {
    saving.value = false
  }
}

async function remove(item: any) {
  if (!confirm(`حذف الجهة «${item.name}»؟`)) return
  try {
    await api(`/authorities/${item.id}`, { method: 'DELETE' })
    toast.success('تم الحذف.')
    await loadItems()
  } catch (e: any) {
    toast.error(e?.data?.message || 'تعذّر الحذف.')
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">الجهات المختصة</h1>
        <p class="page-sub">{{ items.length }} جهة</p>
      </div>
      <div class="row gap-sm">
        <NuxtLink to="/manage" class="btn btn-outline btn-sm">رجوع</NuxtLink>
        <button class="btn btn-primary btn-sm" @click="openCreate"><i class="pi pi-plus" /> إضافة</button>
      </div>
    </div>

    <DataTable :value="items" :loading="loading" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]" dataKey="id" stripedRows>
      <Column header="الجهة">
        <template #body="{ data }">
          <div class="row gap-sm">
            <span class="color-dot" :style="{ background: data.color ? (String(data.color).startsWith('#') ? data.color : '#' + data.color) : 'var(--border-strong)' }" />
            {{ data.name }}
          </div>
        </template>
      </Column>
      <Column header="المحافظة / المنطقة">
        <template #body="{ data }">{{ regionWithGov(data.area_id) }}</template>
      </Column>
      <Column field="code" header="الرمز" sortable />
      <Column header="الهاتف">
        <template #body="{ data }">{{ data.contact_phone_1 || '—' }}</template>
      </Column>
      <Column header="إجراءات" style="width: 170px">
        <template #body="{ data }">
          <div class="row gap-sm">
            <button class="btn btn-outline btn-sm btn-icon" title="تعديل" @click="openEdit(data)"><i class="pi pi-pencil" /></button>
            <button class="btn btn-danger btn-sm btn-icon" title="حذف" @click="remove(data)"><i class="pi pi-trash" /></button>
          </div>
        </template>
      </Column>
    </DataTable>

    <Modal v-if="modal" :title="editing ? 'تعديل جهة' : 'جهة جديدة'" @close="modal = false">
      <form @submit.prevent="save">
        <div v-if="error" class="alert alert-error" style="margin-bottom: 14px">{{ error }}</div>
        <div class="grid grid-2">
          <div class="field"><label class="label">الاسم</label><input v-model="form.name" class="input" required /></div>
          <div class="field"><label class="label">الرمز</label><input v-model="form.code" class="input" required /></div>
        </div>
        <div class="field">
          <label class="label">المحافظة</label>
          <SearchableSelect v-model="governorateId" :options="cityOptions" placeholder="ابحث واختر المحافظة" />
        </div>
        <div class="field">
          <label class="label">المنطقة</label>
          <SearchableSelect
            v-model="form.area_id"
            :options="areaOptions"
            :placeholder="governorateId ? 'ابحث واختر المنطقة' : 'اختر المحافظة أولاً'"
          />
        </div>
        <div class="field"><label class="label">الوصف</label><input v-model="form.description" class="input" /></div>
        <div class="grid grid-2">
          <div class="field"><label class="label">هاتف 1</label><input v-model="form.contact_phone_1" class="input" type="tel" /></div>
          <div class="field"><label class="label">هاتف 2</label><input v-model="form.contact_phone_2" class="input" type="tel" /></div>
        </div>
        <div class="field"><label class="label">العنوان</label><input v-model="form.address" class="input" /></div>
        <div class="grid grid-2">
          <div class="field"><label class="label">أيقونة</label><input v-model="form.icon" class="input" placeholder="اسم/رابط" /></div>
          <div class="field">
            <label class="label">اللون</label>
            <div class="row gap-sm">
              <input v-model="colorPicker" type="color" class="color-input" title="اختر اللون" />
              <input v-model="form.color" class="input" placeholder="مثال: 1E40AF" style="flex: 1" />
            </div>
          </div>
        </div>
        <AppSwitch v-model="form.active" label="مفعّلة" />
        <div class="row gap-sm mt-lg">
          <button class="btn btn-primary" type="submit" :disabled="saving"><span v-if="saving" class="spinner" />حفظ</button>
          <button type="button" class="btn btn-outline" @click="modal = false">إلغاء</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<style scoped>
.color-input {
  width: 46px;
  height: 42px;
  padding: 3px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
  flex: none;
}
.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex: none;
  border: 1px solid var(--border);
}
</style>
