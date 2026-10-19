<script setup lang="ts">
definePageMeta({ middleware: 'super-admin' })

const api = useApi()
const toast = useToast()
const { user: me } = useAuth()

const items = ref<any[]>([])
const authorities = ref<any[]>([])
const areas = ref<any[]>([])
const cities = ref<any[]>([])
const loading = ref(true)
const modal = ref(false)
const creating = ref(false)
const editing = ref<any | null>(null)
const saving = ref(false)
const error = ref('')
const form = reactive({
  name: '',
  phone: '',
  password: '',
  role: 'user',
  authority_id: '' as string | number,
})

const roleOptions = [
  { value: 'user', label: 'مستخدم' },
  { value: 'representative', label: 'موظف حكومي' },
  { value: 'admin', label: 'مدير' },
  { value: 'super_admin', label: 'مدير عام' },
]
// Governorate/region filters + a name suffix so same-named authorities are distinct.
const authGov = ref<string | number>('')
const authRegion = ref<string | number>('')
const govOptions = computed(() => cities.value.map((c) => ({ value: c.id, label: c.name })))
const authRegionOptions = computed(() =>
  areas.value.filter((a) => !authGov.value || a.city_id === authGov.value).map((a) => ({ value: a.id, label: a.name })),
)
function authoritySuffix(id: number) {
  const auth = authorities.value.find((a) => a.id === id)
  if (!auth) return ''
  const region = areas.value.find((a) => a.id === auth.area_id)
  const city = region ? cities.value.find((c) => c.id === region.city_id) : null
  return [city?.name, region?.name].filter(Boolean).join(' - ')
}
function authorityLabel(id: number) {
  const auth = authorities.value.find((a) => a.id === id)
  if (!auth) return ''
  const s = authoritySuffix(id)
  return s ? `${auth.name} (${s})` : auth.name
}
const authorityOptions = computed(() => {
  let list = [...authorities.value]
  if (authRegion.value) list = list.filter((a) => a.area_id === authRegion.value)
  else if (authGov.value) list = list.filter((a) => areas.value.find((x) => x.id === a.area_id)?.city_id === authGov.value)
  return list.map((a) => ({ value: a.id, label: authorityLabel(a.id) }))
})
watch(authGov, () => {
  if (authRegion.value && areas.value.find((a) => a.id === authRegion.value)?.city_id !== authGov.value) authRegion.value = ''
  if (form.authority_id && !authorityOptions.value.some((o) => o.value === form.authority_id)) form.authority_id = ''
})
watch(authRegion, () => {
  if (form.authority_id && !authorityOptions.value.some((o) => o.value === form.authority_id)) form.authority_id = ''
})

function currentRole(u: any) {
  const roles = (u.roles ?? []).map((r: any) => r.name)
  if (roles.includes('super_admin')) return 'super_admin'
  if (roles.includes('admin')) return 'admin'
  if (roles.includes('representative')) return 'representative'
  return 'user'
}
const roleLabel = (v: string) => roleOptions.find((r) => r.value === v)?.label ?? v

// Reflect a rep's current authority in the filter dropdowns when editing.
function prefillAuthFilters(authorityId: string | number) {
  const auth = authorities.value.find((a) => a.id === authorityId)
  const region = auth ? areas.value.find((a) => a.id === auth.area_id) : null
  authRegion.value = region?.id ?? ''
  authGov.value = region?.city_id ?? ''
}

async function loadItems() {
  loading.value = true
  try {
    const [u, a, ar, c] = await Promise.all([
      api<{ data: any[] }>('/users', { params: { per_page: 100 } }),
      api<{ data: any[] }>('/authorities', { params: { per_page: 100 } }),
      api<{ data: any[] }>('/areas', { params: { per_page: 100 } }),
      api<{ data: any[] }>('/cities', { params: { per_page: 100 } }),
    ])
    items.value = u.data
    authorities.value = a.data
    areas.value = ar.data
    cities.value = c.data
  } finally {
    loading.value = false
  }
}
onMounted(loadItems)

function openCreate() {
  creating.value = true
  editing.value = null
  Object.assign(form, { name: '', phone: '', password: '', role: 'user', authority_id: '' })
  authGov.value = ''
  authRegion.value = ''
  error.value = ''
  modal.value = true
}
function openEdit(u: any) {
  creating.value = false
  editing.value = u
  Object.assign(form, {
    name: u.name,
    phone: u.phone,
    password: '',
    role: currentRole(u),
    authority_id: u.authority_id ?? '',
  })
  prefillAuthFilters(u.authority_id ?? '')
  error.value = ''
  modal.value = true
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    if (creating.value) {
      const body: Record<string, any> = {
        name: form.name,
        phone: form.phone,
        password: form.password,
        role: form.role,
      }
      if (form.role === 'representative') body.authority_id = form.authority_id
      await api('/users', { method: 'POST', body })
      toast.success('تمت إضافة المستخدم.')
      await loadItems()
    } else {
      const body: Record<string, any> = { role: form.role }
      if (form.role === 'representative') body.authority_id = form.authority_id
      const res = await api<{ data: any }>(`/users/${editing.value.id}/role`, { method: 'PATCH', body })
      const idx = items.value.findIndex((x) => x.id === editing.value.id)
      if (idx !== -1) items.value[idx] = res.data
      toast.success('تم تحديث الدور.')
    }
    modal.value = false
  } catch (e: any) {
    const errs = e?.data?.errors as Record<string, string[]> | undefined
    error.value = errs ? Object.values(errs)[0]?.[0] ?? 'تعذّر الحفظ.' : e?.data?.message || 'تعذّر الحفظ.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">المستخدمون</h1>
        <p class="page-sub">{{ items.length }} مستخدم</p>
      </div>
      <div class="row gap-sm">
        <NuxtLink to="/manage" class="btn btn-outline btn-sm">رجوع</NuxtLink>
        <button class="btn btn-primary btn-sm" @click="openCreate"><i class="pi pi-plus" /> إضافة مستخدم</button>
      </div>
    </div>

    <p class="hint" style="margin-bottom: 14px">
      أضف حسابات للمدراء والموظفين الحكوميين، أو غيّر أدوار المستخدمين الحاليين وعيّن موظفين حكوميين للجهات المختصة.
    </p>

    <DataTable :value="items" :loading="loading" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]" dataKey="id" stripedRows>
      <Column field="name" header="الاسم" sortable />
      <Column field="phone" header="الهاتف" />
      <Column header="الدور">
        <template #body="{ data }">
          <span class="badge badge-medium">{{ roleLabel(currentRole(data)) }}</span>
        </template>
      </Column>
      <Column header="الجهة">
        <template #body="{ data }">
          {{ currentRole(data) === 'representative' && data.authority_id ? authorityLabel(data.authority_id) : '—' }}
        </template>
      </Column>
      <Column header="إجراءات" style="width: 160px">
        <template #body="{ data }">
          <button v-if="data.id !== me?.id" class="btn btn-outline btn-sm btn-icon" title="تعديل الدور" @click="openEdit(data)"><i class="pi pi-user-edit" /></button>
          <span v-else class="muted small">أنت</span>
        </template>
      </Column>
    </DataTable>

    <Modal v-if="modal" :title="creating ? 'مستخدم جديد' : `دور: ${editing?.name}`" @close="modal = false">
      <form @submit.prevent="save">
        <div v-if="error" class="alert alert-error" style="margin-bottom: 14px">{{ error }}</div>
        <template v-if="creating">
          <div class="field"><label class="label">الاسم</label><input v-model="form.name" class="input" required /></div>
          <div class="field"><label class="label">رقم الهاتف</label><input v-model="form.phone" class="input" type="tel" required /></div>
          <div class="field">
            <label class="label">كلمة المرور</label>
            <input v-model="form.password" class="input" type="password" autocomplete="new-password" required />
            <span class="hint">8 أحرف على الأقل</span>
          </div>
        </template>
        <div class="field">
          <label class="label">الدور</label>
          <select v-model="form.role" class="select">
            <option v-for="r in roleOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>
        </div>
        <div v-if="form.role === 'representative'" class="field">
          <label class="label">الجهة المختصة</label>
          <div class="grid grid-2" style="margin-bottom: 8px">
            <SearchableSelect v-model="authGov" :options="govOptions" placeholder="تصفية حسب المحافظة" />
            <SearchableSelect v-model="authRegion" :options="authRegionOptions" placeholder="تصفية حسب المنطقة" />
          </div>
          <SearchableSelect v-model="form.authority_id" :options="authorityOptions" placeholder="ابحث واختر الجهة" />
        </div>
        <div class="row gap-sm mt-lg">
          <button class="btn btn-primary" type="submit" :disabled="saving">
            <span v-if="saving" class="spinner" />حفظ
          </button>
          <button type="button" class="btn btn-outline" @click="modal = false">إلغاء</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
