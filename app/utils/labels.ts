export const reportTypeOptions = [
  { value: 'criminal', label: 'جريمة' },
  { value: 'police', label: 'شرطة' },
  { value: 'cybercrime', label: 'جريمة إلكترونية' },
  { value: 'fire', label: 'حريق' },
  { value: 'medical', label: 'إسعاف / طبي' },
  { value: 'environment', label: 'بيئة' },
  { value: 'traffic', label: 'مرور' },
  { value: 'accident', label: 'حادث' },
  { value: 'other', label: 'أخرى' },
]

export const priorityOptions = [
  { value: 'low', label: 'منخفض' },
  { value: 'medium', label: 'متوسط' },
  { value: 'high', label: 'عالٍ' },
  { value: 'critical', label: 'حرج' },
]

export const statusOptions = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'in_progress', label: 'قيد المعالجة' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغى' },
]

const toMap = (opts: { value: string; label: string }[]) =>
  Object.fromEntries(opts.map((o) => [o.value, o.label]))

const typeMap = toMap(reportTypeOptions)
const priorityMap = toMap(priorityOptions)
const statusMap = toMap(statusOptions)

export const reportTypeLabel = (v: string) => typeMap[v] ?? v
export const priorityLabel = (v: string) => priorityMap[v] ?? v
export const statusLabel = (v: string) => statusMap[v] ?? v

/** Allowed status transitions — mirrors the backend ReportStatus enum. */
export const statusTransitions: Record<string, string[]> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return value
  }
}

export function formatBytes(bytes: number | string | null | undefined): string {
  const n = Number(bytes)
  if (!n || Number.isNaN(n)) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
