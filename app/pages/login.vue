<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })

const { login, isAdmin } = useAuth()
const form = reactive({ phone: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await login(form.phone, form.password)
    await navigateTo(isAdmin.value ? '/dashboard' : '/reports')
  } catch (e: any) {
    error.value = e?.data?.message || 'فشل تسجيل الدخول. تحقّق من رقم الهاتف وكلمة المرور.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card card-pad">
    <h1 class="page-title center">تسجيل الدخول</h1>
    <p class="page-sub center">أدخل بياناتك للمتابعة</p>

    <form class="mt-lg" @submit.prevent="submit">
      <div v-if="error" class="alert alert-error" style="margin-bottom: 16px">{{ error }}</div>

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
          autocomplete="current-password"
          required
        />
      </div>

      <button class="btn btn-primary btn-block" type="submit" :disabled="loading">
        <span v-if="loading" class="spinner" />
        دخول
      </button>
    </form>

    <p class="center muted small mt-lg">
      ليس لديك حساب؟
      <NuxtLink to="/register" style="color: var(--primary); font-weight: 600">إنشاء حساب</NuxtLink>
    </p>
  </div>
</template>
