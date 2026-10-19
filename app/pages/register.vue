<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })

const { register } = useAuth()
const form = reactive({ name: '', phone: '', password: '', password_confirmation: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await register({ ...form })
    await navigateTo('/reports')
  } catch (e: any) {
    const errors = e?.data?.errors as Record<string, string[]> | undefined
    error.value = errors
      ? Object.values(errors)[0]?.[0] ?? 'تعذّر إنشاء الحساب.'
      : e?.data?.message || 'تعذّر إنشاء الحساب.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card card-pad">
    <h1 class="page-title center">إنشاء حساب</h1>
    <p class="page-sub center">سجّل لتتمكن من تقديم البلاغات ومتابعتها</p>

    <form class="mt-lg" @submit.prevent="submit">
      <div v-if="error" class="alert alert-error" style="margin-bottom: 16px">{{ error }}</div>

      <div class="field">
        <label class="label" for="name">الاسم الكامل</label>
        <input id="name" v-model="form.name" class="input" type="text" name="name" autocomplete="name" required />
      </div>
      <div class="field">
        <label class="label" for="phone">رقم الهاتف</label>
        <input
          id="phone"
          v-model="form.phone"
          class="input"
          type="tel"
          name="phone"
          autocomplete="tel"
          inputmode="tel"
          placeholder="09xxxxxxxx"
          required
        />
      </div>
      <div class="field">
        <label class="label" for="password">كلمة المرور</label>
        <input
          id="password"
          v-model="form.password"
          class="input"
          type="password"
          name="password"
          autocomplete="new-password"
          required
        />
        <span class="hint">8 أحرف على الأقل</span>
      </div>
      <div class="field">
        <label class="label" for="password_confirmation">تأكيد كلمة المرور</label>
        <input
          id="password_confirmation"
          v-model="form.password_confirmation"
          class="input"
          type="password"
          name="password_confirmation"
          autocomplete="new-password"
          required
        />
      </div>

      <button class="btn btn-primary btn-block" type="submit" :disabled="loading">
        <span v-if="loading" class="spinner" />
        إنشاء الحساب
      </button>
    </form>

    <p class="center muted small mt-lg">
      لديك حساب بالفعل؟
      <NuxtLink to="/login" style="color: var(--primary); font-weight: 600">تسجيل الدخول</NuxtLink>
    </p>
  </div>
</template>
