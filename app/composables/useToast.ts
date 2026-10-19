interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function push(message: string, type: Toast['type'] = 'info', timeout = 3500) {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    toasts.value = [...toasts.value, { id, message, type }]
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, timeout)
  }

  return {
    toasts,
    success: (m: string) => push(m, 'success'),
    error: (m: string) => push(m, 'error'),
    info: (m: string) => push(m, 'info'),
  }
}
