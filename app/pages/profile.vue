<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { user, updateProfile, updatePassword, updateNotifications } = useAuth()
const toast = useToast()

const profileForm = reactive({ name: user.value?.name ?? '', phone: user.value?.phone ?? '' })
const profileError = ref('')
const profileLoading = ref(false)

const notifForm = reactive({
  notify_on_received: user.value?.notify_on_received ?? true,
  notify_on_status_change: user.value?.notify_on_status_change ?? true,
  notify_on_closed: user.value?.notify_on_closed ?? true,
})
const notifError = ref('')
const notifLoading = ref(false)

const passwordForm = reactive({ current_password: '', password: '', password_confirmation: '' })
const passwordError = ref('')
const passwordLoading = ref(false)

function firstError(e: any, fallback: string) {
  const errs = e?.data?.errors as Record<string, string[]> | undefined
  return errs ? Object.values(errs)[0]?.[0] ?? fallback : e?.data?.message || fallback
}

async function saveProfile() {
  profileError.value = ''
  profileLoading.value = true
  try {
    await updateProfile({ name: profileForm.name, phone: profileForm.phone })
    toast.success('تم تحديث الملف الشخصي.')
  } catch (e: any) {
    profileError.value = firstError(e, 'تعذّر تحديث الملف الشخصي.')
  } finally {
    profileLoading.value = false
  }
}

async function saveNotifications() {
  notifError.value = ''
  notifLoading.value = true
  try {
    await updateNotifications({ ...notifForm })
    toast.success('تم تحديث تفضيلات الإشعارات.')
  } catch (e: any) {
    notifError.value = firstError(e, 'تعذّر تحديث تفضيلات الإشعارات.')
  } finally {
    notifLoading.value = false
  }
}

async function savePassword() {
  passwordError.value = ''
  passwordLoading.value = true
  try {
    await updatePassword({ ...passwordForm })
    passwordForm.current_password = ''
    passwordForm.password = ''
    passwordForm.password_confirmation = ''
    toast.success('تم تغيير كلمة المرور.')
  } catch (e: any) {
    passwordError.value = firstError(e, 'تعذّر تغيير كلمة المرور.')
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <div style="max-width: 640px">
    <div class="page-head">
      <div>
        <h1 class="page-title">الملف الشخصي</h1>
        <p class="page-sub">إدارة معلومات حسابك</p>
      </div>
    </div>

    <div class="card card-pad" style="margin-bottom: 20px">
      <h3 style="margin-bottom: 16px">المعلومات الشخصية</h3>
      <form @submit.prevent="saveProfile">
        <div v-if="profileError" class="alert alert-error" style="margin-bottom: 14px">{{ profileError }}</div>
        <div class="field">
          <label class="label">الاسم</label>
          <input v-model="profileForm.name" class="input" type="text" name="name" autocomplete="name" required />
        </div>
        <div class="field">
          <label class="label">رقم الهاتف</label>
          <input v-model="profileForm.phone" class="input" type="tel" name="phone" autocomplete="tel" required />
        </div>
        <button class="btn btn-primary" type="submit" :disabled="profileLoading">
          <span v-if="profileLoading" class="spinner" />
          حفظ التغييرات
        </button>
      </form>
    </div>

    <div class="card card-pad" style="margin-bottom: 20px">
      <h3 style="margin-bottom: 4px">تفضيلات الإشعارات</h3>
      <p class="muted small" style="margin-bottom: 12px">اختر الإشعارات التي ترغب باستلامها حول بلاغاتك.</p>
      <div v-if="notifError" class="alert alert-error" style="margin-bottom: 14px">{{ notifError }}</div>

      <div class="switch-row">
        <div>
          <div class="switch-title">إشعار عند استلام البلاغ</div>
          <div class="muted small">تأكيد باستلام بلاغك عند إرساله.</div>
        </div>
        <label class="switch">
          <input v-model="notifForm.notify_on_received" type="checkbox" />
          <span class="switch-track"><span class="switch-thumb" /></span>
        </label>
      </div>

      <div class="switch-row">
        <div>
          <div class="switch-title">إشعار عند تغيير حالة البلاغ</div>
          <div class="muted small">عند تحديث حالة بلاغك (قيد المعالجة…).</div>
        </div>
        <label class="switch">
          <input v-model="notifForm.notify_on_status_change" type="checkbox" />
          <span class="switch-track"><span class="switch-thumb" /></span>
        </label>
      </div>

      <div class="switch-row">
        <div>
          <div class="switch-title">إشعار عند إغلاق البلاغ</div>
          <div class="muted small">عند إغلاق البلاغ (مكتمل أو ملغى).</div>
        </div>
        <label class="switch">
          <input v-model="notifForm.notify_on_closed" type="checkbox" />
          <span class="switch-track"><span class="switch-thumb" /></span>
        </label>
      </div>

      <button class="btn btn-primary" type="button" :disabled="notifLoading" style="margin-top: 16px" @click="saveNotifications">
        <span v-if="notifLoading" class="spinner" />
        حفظ التفضيلات
      </button>
    </div>

    <div class="card card-pad">
      <h3 style="margin-bottom: 16px">تغيير كلمة المرور</h3>
      <form @submit.prevent="savePassword">
        <div v-if="passwordError" class="alert alert-error" style="margin-bottom: 14px">{{ passwordError }}</div>
        <div class="field">
          <label class="label">كلمة المرور الحالية</label>
          <input v-model="passwordForm.current_password" class="input" type="password" autocomplete="current-password" required />
        </div>
        <div class="field">
          <label class="label">كلمة المرور الجديدة</label>
          <input v-model="passwordForm.password" class="input" type="password" autocomplete="new-password" required />
          <span class="hint">8 أحرف على الأقل</span>
        </div>
        <div class="field">
          <label class="label">تأكيد كلمة المرور</label>
          <input v-model="passwordForm.password_confirmation" class="input" type="password" autocomplete="new-password" required />
        </div>
        <button class="btn btn-primary" type="submit" :disabled="passwordLoading">
          <span v-if="passwordLoading" class="spinner" />
          تحديث كلمة المرور
        </button>
      </form>
    </div>
  </div>
</template>
