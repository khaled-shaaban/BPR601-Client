<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const id = route.params.id as string
const api = useApi()
const toast = useToast()
const { isAdmin, isRepresentative, user } = useAuth()
const { areaName, authorityLabel, load: loadRef } = useReferenceData()

const { data: reportData, pending, error: reportError, refresh: refreshReport } = await useAsyncData(
  `report-${id}`,
  () => api<{ data: any }>(`/reports/${id}`),
)
const report = computed(() => reportData.value?.data)

// Admins manage any report; a representative manages only their own authority's reports
// (a report they merely filed to another authority is view-only for them).
const canManageStatus = computed(() => {
  if (isAdmin.value) return true
  return isRepresentative.value && report.value?.authority_id === user.value?.authority_id
})

const { data: commentsData, refresh: refreshComments } = await useAsyncData(
  `comments-${id}`,
  () => api<{ data: any[] }>(`/reports/${id}/comments`),
)
const comments = computed(() => commentsData.value?.data ?? [])

const { data: repNotesData, refresh: refreshRepNotes } = await useAsyncData(
  `repnotes-${id}`,
  () => api<{ data: any[] }>(`/reports/${id}/representative-notes`),
)
const repNotes = computed(() => repNotesData.value?.data ?? [])

const admins = ref<any[]>([])
const assigneeOptions = computed(() => admins.value.map((a) => ({ value: a.id, label: a.name })))
async function loadAssignees() {
  if (!isAdmin.value) return
  try {
    admins.value = (await api<{ data: any[] }>('/users/assignees')).data
  } catch {
    // ignore
  }
}

onMounted(() => {
  loadRef()
  loadAssignees()
})

/* ---- status + assign ---- */
const statusForm = reactive({ status: '', note: '' })
const assignForm = reactive({ assigned_to: '' })
const allowedNext = computed<string[]>(() =>
  report.value ? statusTransitions[report.value.status] ?? [] : [],
)

async function changeStatus() {
  if (!statusForm.status) return
  try {
    await api(`/reports/${id}/status`, {
      method: 'PATCH',
      body: { status: statusForm.status, note: statusForm.note || undefined },
    })
    statusForm.status = ''
    statusForm.note = ''
    await Promise.all([refreshReport(), refreshComments(), refreshRepNotes()])
    toast.success('تم تحديث الحالة.')
  } catch (e: any) {
    toast.error(e?.data?.message || 'تعذّر تحديث الحالة.')
  }
}

async function assign() {
  if (!assignForm.assigned_to) return
  try {
    await api(`/reports/${id}/assign`, {
      method: 'PATCH',
      body: { assigned_to: Number(assignForm.assigned_to) },
    })
    await Promise.all([refreshReport(), refreshComments()])
    toast.success('تم إسناد البلاغ.')
  } catch (e: any) {
    toast.error(e?.data?.message || 'تعذّر إسناد البلاغ.')
  }
}

/* ---- representative notes ---- */
const repNoteBody = ref('')
const repNoteLoading = ref(false)
async function addRepNote() {
  if (!repNoteBody.value.trim()) return
  repNoteLoading.value = true
  try {
    await api(`/reports/${id}/representative-notes`, { method: 'POST', body: { body: repNoteBody.value } })
    repNoteBody.value = ''
    await refreshRepNotes()
  } catch {
    toast.error('تعذّر إضافة الملاحظة.')
  } finally {
    repNoteLoading.value = false
  }
}

/* ---- comments ---- */
const commentBody = ref('')
const commentLoading = ref(false)
async function addComment() {
  if (!commentBody.value.trim()) return
  commentLoading.value = true
  try {
    await api(`/reports/${id}/comments`, { method: 'POST', body: { body: commentBody.value } })
    commentBody.value = ''
    await refreshComments()
  } catch {
    toast.error('تعذّر إرسال التعليق.')
  } finally {
    commentLoading.value = false
  }
}

const commentIcon = (type: string) =>
  type === 'status_change' ? '🔄' : type === 'assignment' ? '👤' : '💬'

/* ---- media ---- */
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const canModify = computed(() => isAdmin.value || (report.value && report.value.user_id === useAuth().user.value?.id))

async function uploadFiles(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (!files?.length) return
  const fd = new FormData()
  Array.from(files).forEach((f) => fd.append('files[]', f))
  uploading.value = true
  try {
    await api(`/reports/${id}/media`, { method: 'POST', body: fd })
    await refreshReport()
    toast.success('تم رفع المرفقات.')
  } catch (e: any) {
    const errors = e?.data?.errors as Record<string, string[]> | undefined
    toast.error(errors ? Object.values(errors)[0]?.[0] ?? 'فشل الرفع.' : 'فشل رفع الملفات.')
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function deleteMedia(mediaId: number) {
  try {
    await api(`/reports/${id}/media/${mediaId}`, { method: 'DELETE' })
    await refreshReport()
    toast.success('تم حذف المرفق.')
  } catch {
    toast.error('تعذّر حذف المرفق.')
  }
}

const isImage = (m: any) => (m.media_type || '').startsWith('image/')
</script>

<template>
  <div v-if="pending" class="col gap-lg">
    <div class="skeleton skeleton-line" style="width: 40%; height: 28px" />
    <div class="grid grid-2">
      <div class="card card-pad"><div class="skeleton skeleton-block" /></div>
      <div class="card card-pad"><div class="skeleton skeleton-block" /></div>
    </div>
  </div>

  <div v-else-if="reportError || !report" class="card empty">
    تعذّر عرض هذا البلاغ — قد لا تملك صلاحية الوصول إليه.
    <div class="mt"><NuxtLink to="/reports" class="btn btn-outline btn-sm">العودة للبلاغات</NuxtLink></div>
  </div>

  <div v-else class="col gap-lg">
    <div>
      <div class="row gap-sm" style="margin-bottom: 6px">
        <NuxtLink to="/reports" class="muted small">← البلاغات</NuxtLink>
        <span class="muted small">/ #{{ report.id }}</span>
      </div>
      <div class="col" style="gap: 10px">
        <h1 class="page-title">{{ report.title }}</h1>
        <div class="row gap-sm wrap">
          <StatusBadge :status="report.status" />
          <PriorityBadge :priority="report.priority" />
          <span class="badge" style="color: var(--text-muted); background: var(--surface-2)">
            {{ reportTypeLabel(report.type) }}
          </span>
        </div>
      </div>
    </div>

    <div class="grid grid-2" style="align-items: start">
      <!-- Left column -->
      <div class="col gap-lg">
        <div class="card card-pad">
          <h3 style="margin-bottom: 14px">التفاصيل</h3>
          <p v-if="report.description" style="margin-bottom: 16px">{{ report.description }}</p>
          <p v-else class="muted" style="margin-bottom: 16px">لا يوجد وصف.</p>
          <div class="meta-row" style="flex-direction: column; gap: 10px; margin-bottom: 16px">
            <span>المنطقة: <b>{{ areaName(report.area_id) || '—' }}</b></span>
            <span>الجهة المختصة: <b>{{ authorityLabel(report.authority_id) || '—' }}</b></span>
            <span>وقت الحادثة: <b>{{ formatDate(report.date) }}</b></span>
            <span v-if="report.user">المُبلّغ: <b>{{ report.user.name }}</b></span>
            <span>المُسند إليه: <b>{{ report.assignee?.name || 'غير مُسنَد' }}</b></span>
          </div>
          <MapPicker :lat="report.latitude" :lng="report.longitude" readonly height="220px" />
        </div>

        <!-- Media -->
        <div class="card card-pad">
          <div class="row-between" style="margin-bottom: 14px">
            <h3>المرفقات</h3>
            <label v-if="canModify" class="btn btn-outline btn-sm" style="cursor: pointer">
              <span v-if="uploading" class="spinner" /> + إضافة ملفات
              <input ref="fileInput" type="file" multiple hidden accept="image/*,video/*,.pdf,.doc,.docx" @change="uploadFiles" />
            </label>
          </div>
          <div v-if="!report.media?.length" class="muted small">لا توجد مرفقات.</div>
          <div v-else class="media-grid">
            <div v-for="m in report.media" :key="m.id" class="media-thumb">
              <a v-if="isImage(m)" :href="m.url" target="_blank"><img :src="m.url" :alt="m.media_name" /></a>
              <a v-else :href="m.url" target="_blank" class="media-file">📄 {{ m.media_name }}</a>
              <button v-if="canModify" class="btn btn-danger btn-sm" style="position: absolute; top: 4px; inset-inline-start: 4px; padding: 2px 8px" @click.prevent="deleteMedia(m.id)">✕</button>
            </div>
          </div>
        </div>

        <!-- Representative notes (staff only) -->
        <div v-if="canManageStatus" class="card card-pad">
          <h3 style="margin-bottom: 10px">ملاحظات الموظف الحكومي</h3>
          <div v-if="!repNotes.length" class="muted small">لا توجد ملاحظات بعد.</div>
          <div v-else class="timeline">
            <div v-for="n in repNotes" :key="n.id" class="timeline-item">
              <div class="timeline-dot system">📝</div>
              <div class="col" style="gap: 2px">
                <div class="row gap-sm wrap">
                  <b class="small">{{ n.user?.name || 'موظف حكومي' }}</b>
                  <span class="muted small">{{ formatDate(n.created_at) }}</span>
                  <StatusBadge v-if="n.status" :status="n.status" />
                </div>
                <span>{{ n.body }}</span>
              </div>
            </div>
          </div>
          <form v-if="isRepresentative" class="row gap-sm mt-lg" @submit.prevent="addRepNote">
            <input v-model="repNoteBody" class="input grow" placeholder="أضف ملاحظة…" maxlength="2000" />
            <button class="btn btn-primary" type="submit" :disabled="repNoteLoading || !repNoteBody.trim()">
              <span v-if="repNoteLoading" class="spinner" /> إضافة
            </button>
          </form>
        </div>

        <!-- Timeline -->
        <div class="card card-pad">
          <h3 style="margin-bottom: 6px">المتابعة والتعليقات</h3>
          <div class="timeline">
            <div v-if="!comments.length" class="muted small" style="padding: 12px 0">لا توجد تعليقات بعد.</div>
            <div v-for="c in comments" :key="c.id" class="timeline-item">
              <div class="timeline-dot" :class="{ system: c.type !== 'comment' }">{{ commentIcon(c.type) }}</div>
              <div class="col" style="gap: 2px">
                <div class="row gap-sm">
                  <b class="small">{{ c.user?.name || 'النظام' }}</b>
                  <span class="muted small">{{ formatDate(c.created_at) }}</span>
                </div>
                <span>{{ c.body }}</span>
              </div>
            </div>
          </div>
          <form class="row gap-sm mt-lg" @submit.prevent="addComment">
            <input v-model="commentBody" class="input grow" placeholder="أضف تعليقًا…" maxlength="2000" />
            <button class="btn btn-primary" type="submit" :disabled="commentLoading || !commentBody.trim()">
              <span v-if="commentLoading" class="spinner" /> إرسال
            </button>
          </form>
        </div>
      </div>

      <!-- Right column: staff actions -->
      <div v-if="canManageStatus" class="col gap-lg">
        <div class="card card-pad">
          <h3 style="margin-bottom: 14px">إجراءات</h3>

          <div class="field">
            <label class="label">تغيير الحالة</label>
            <select v-model="statusForm.status" class="select">
              <option value="" disabled>اختر الحالة الجديدة</option>
              <option v-for="s in allowedNext" :key="s" :value="s">{{ statusLabel(s) }}</option>
            </select>
            <p v-if="!allowedNext.length" class="hint">
              لا يمكن تغيير الحالة الحالية ({{ statusLabel(report.status) }}).
            </p>
          </div>
          <div class="field">
            <input v-model="statusForm.note" class="input" placeholder="ملاحظة (اختياري)" />
          </div>
          <button class="btn btn-primary btn-block" :disabled="!statusForm.status" @click="changeStatus">
            تحديث الحالة
          </button>

          <template v-if="isAdmin">
            <hr style="border: none; border-top: 1px solid var(--border); margin: 20px 0" />
            <div class="field">
              <label class="label">إسناد البلاغ</label>
              <SearchableSelect v-model="assignForm.assigned_to" :options="assigneeOptions" placeholder="ابحث واختر مسؤولًا" />
            </div>
            <button class="btn btn-outline btn-block" :disabled="!assignForm.assigned_to" @click="assign">
              إسناد
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
