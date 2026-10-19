<script setup lang="ts">
definePageMeta({ middleware: 'super-admin' })

const api = useApi()
const toast = useToast()

const items = ref<any[]>([])
const loading = ref(true)
const modal = ref(false)
const editing = ref<any | null>(null)
const saving = ref(false)
const error = ref('')
const form = reactive({
  name: '',
  code: '',
  latitude: '' as string | number,
  longitude: '' as string | number,
  radius: null as number | null,
  active: true,
})

async function loadItems() {
  loading.value = true
  try {
    items.value = (await api<{ data: any[] }>('/cities', { params: { per_page: 100 } })).data
  } finally {
    loading.value = false
  }
}
onMounted(loadItems)

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', code: '', latitude: '', longitude: '', radius: null, active: true })
  error.value = ''
  modal.value = true
}
function openEdit(item: any) {
  editing.value = item
  Object.assign(form, {
    name: item.name,
    code: item.code,
    latitude: item.latitude ?? '',
    longitude: item.longitude ?? '',
    radius: item.radius ?? null,
    active: !!item.active,
  })
  error.value = ''
  modal.value = true
}

function onMapUpdate(e: { lat: string; lng: string; radius: number }) {
  form.latitude = e.lat
  form.longitude = e.lng
  form.radius = e.radius
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    if (editing.value) await api(`/cities/${editing.value.id}`, { method: 'PUT', body: form })
    else await api('/cities', { method: 'POST', body: form })
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
  if (!confirm(`حذف المحافظة «${item.name}»؟`)) return
  try {
    await api(`/cities/${item.id}`, { method: 'DELETE' })
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
        <h1 class="page-title">المحافظات</h1>
        <p class="page-sub">{{ items.length }} محافظة</p>
      </div>
      <div class="row gap-sm">
        <NuxtLink to="/manage" class="btn btn-outline btn-sm">رجوع</NuxtLink>
        <button class="btn btn-primary btn-sm" @click="openCreate"><i class="pi pi-plus" /> إضافة</button>
      </div>
    </div>

    <DataTable :value="items" :loading="loading" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]" dataKey="id" stripedRows>
      <Column field="name" header="الاسم" sortable />
      <Column field="code" header="الرمز" sortable />
      <Column header="نطاق التغطية">
        <template #body="{ data }">{{ data.radius ? Math.round(data.radius / 1000) + ' كم' : '—' }}</template>
      </Column>
      <Column header="الحالة">
        <template #body="{ data }">
          <span class="badge" :class="data.active ? 'badge-completed' : 'badge-cancelled'">
            {{ data.active ? 'مفعّلة' : 'معطّلة' }}
          </span>
        </template>
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

    <Modal v-if="modal" :title="editing ? 'تعديل محافظة' : 'محافظة جديدة'" @close="modal = false">
      <form @submit.prevent="save">
        <div v-if="error" class="alert alert-error" style="margin-bottom: 14px">{{ error }}</div>
        <div class="grid grid-2">
          <div class="field"><label class="label">الاسم</label><input v-model="form.name" class="input" required /></div>
          <div class="field"><label class="label">الرمز</label><input v-model="form.code" class="input" required /></div>
        </div>
        <div class="field">
          <label class="label">موقع المحافظة ونطاق التغطية</label>
          <CircleMapPicker
            :key="editing?.id ?? 'new'"
            :lat="form.latitude"
            :lng="form.longitude"
            :radius="form.radius"
            @update="onMapUpdate"
          />
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
