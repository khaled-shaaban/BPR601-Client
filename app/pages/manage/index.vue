<script setup lang="ts">
definePageMeta({ middleware: 'super-admin' })

const sections = [
  { to: '/manage/authorities', title: 'الجهات المختصة', desc: 'إضافة وتعديل الجهات', icon: '🏛️' },
  { to: '/manage/areas', title: 'المناطق', desc: 'إدارة المناطق والأحياء', icon: '📍' },
  { to: '/manage/cities', title: 'المحافظات', desc: 'إدارة المحافظات', icon: '🗺️' },
  { to: '/manage/users', title: 'المستخدمون', desc: 'عرض حسابات المستخدمين', icon: '👥' },
]
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">الإدارة</h1>
        <p class="page-sub">إدارة البيانات المرجعية للنظام</p>
      </div>
    </div>

    <div class="grid grid-2">
      <NuxtLink v-for="s in sections" :key="s.to" :to="s.to" class="card card-pad card-link row gap-lg">
        <span style="font-size: 2rem">{{ s.icon }}</span>
        <div>
          <strong>{{ s.title }}</strong>
          <p class="muted small">{{ s.desc }}</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
