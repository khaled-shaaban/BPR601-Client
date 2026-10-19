/**
 * Polling-based notification updates (Option B — no WebSocket server).
 *
 * While the user is authenticated and the browser tab is visible, this polls a
 * lightweight unread-count endpoint on an interval. When the count rises it
 * fetches the latest notifications and toasts the new ones — mirroring the old
 * real-time behaviour without needing Reverb/Pusher or any long-running daemon,
 * so it works on plain shared hosting. Polling pauses while the tab is hidden
 * and refreshes immediately when it becomes visible again.
 */
export function useRealtime() {
  const { user } = useAuth()
  const unread = useState<number>('notif_unread', () => 0)
  const toast = useToast()
  const config = useRuntimeConfig()
  const api = useApi()

  const intervalMs = Number(config.public.notificationsPollMs) || 25000

  let timer: ReturnType<typeof setInterval> | null = null
  let known = 0
  // Epoch ms: only notifications created after this are toasted (starts at
  // session start so we never toast a backlog of pre-existing unread items).
  let since = 0

  async function fetchCount(): Promise<number | null> {
    try {
      const res = await api<{ data: { unread_count: number } }>('/notifications/unread-count')
      return res.data?.unread_count ?? 0
    } catch {
      return null
    }
  }

  async function toastNew() {
    try {
      const res = await api<{ data: any[] }>('/notifications', { params: { per_page: 10 } })
      const items = res.data ?? []
      const fresh = items.filter((n) => !n.read_at && new Date(n.created_at).getTime() > since)
      // Oldest first so the newest notification ends up as the top-most toast.
      fresh.reverse().forEach((n) => toast.info(n.data?.message || 'لديك إشعار جديد'))
      if (items[0]) since = Math.max(since, new Date(items[0].created_at).getTime())
    } catch {
      // ignore — the badge still updates from the count
    }
  }

  async function poll() {
    if (!user.value) return
    const count = await fetchCount()
    if (count === null) return
    if (count > known) await toastNew()
    known = count
    unread.value = count
  }

  function onVisibility() {
    if (document.visibilityState === 'visible') poll()
  }

  function start() {
    if (!import.meta.client || timer || !user.value) return
    since = Date.now()
    poll() // prime the badge immediately
    timer = setInterval(poll, intervalMs)
    document.addEventListener('visibilitychange', onVisibility)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (import.meta.client) document.removeEventListener('visibilitychange', onVisibility)
    known = 0
  }

  return { unread, start, stop, poll }
}
