<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string | number | null
    options: { value: string | number; label: string }[]
    placeholder?: string
    disabled?: boolean
  }>(),
  { placeholder: 'اختر…', disabled: false },
)
const emit = defineEmits<{ 'update:modelValue': [string | number | null] }>()

const open = ref(false)
const search = ref('')
const root = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)

const selectedLabel = computed(
  () => props.options.find((o) => o.value === props.modelValue)?.label ?? '',
)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => o.label.toLowerCase().includes(q))
})

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    search.value = ''
    nextTick(() => searchInput.value?.focus())
  }
}

function select(option: { value: string | number; label: string }) {
  emit('update:modelValue', option.value)
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="root" class="ss">
    <button
      type="button"
      class="input ss-trigger"
      :class="{ 'ss-placeholder': !selectedLabel }"
      :disabled="disabled"
      @click="toggle"
    >
      <span>{{ selectedLabel || placeholder }}</span>
      <span class="ss-caret">▾</span>
    </button>

    <div v-if="open" class="ss-panel card">
      <input ref="searchInput" v-model="search" class="input ss-search" placeholder="ابحث…" @click.stop />
      <div class="ss-list">
        <button
          v-for="o in filtered"
          :key="o.value"
          type="button"
          class="ss-option"
          :class="{ active: o.value === modelValue }"
          @click="select(o)"
        >
          {{ o.label }}
        </button>
        <div v-if="!filtered.length" class="ss-empty">لا نتائج</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ss { position: relative; }
.ss-trigger {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  cursor: pointer; text-align: start;
}
.ss-placeholder { color: var(--text-muted); }
.ss-caret { color: var(--text-muted); font-size: 0.7rem; }
.ss-panel {
  position: absolute; z-index: 1200; top: calc(100% + 4px); inset-inline: 0;
  padding: 8px; box-shadow: var(--shadow-md);
}
.ss-search { margin-bottom: 8px; }
.ss-list { max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.ss-option {
  text-align: start; padding: 8px 10px; border-radius: var(--radius-sm);
  background: transparent; border: 0; cursor: pointer; font: inherit; color: var(--text);
}
.ss-option:hover { background: var(--surface-2); }
.ss-option.active { background: var(--primary-soft); color: var(--primary); font-weight: 600; }
.ss-empty { padding: 10px; text-align: center; color: var(--text-muted); font-size: 0.85rem; }
</style>
