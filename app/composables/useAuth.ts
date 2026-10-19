interface AuthResponse {
  data: { user: Record<string, any>; token: string }
}

export function useAuth() {
  const token = useAuthToken()
  const user = useState<Record<string, any> | null>('auth_user', () => null)

  async function login(phone: string, password: string) {
    const res = await useApi()<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { phone, password },
    })
    token.value = res.data.token
    user.value = res.data.user
  }

  async function register(payload: {
    name: string
    phone: string
    password: string
    password_confirmation: string
  }) {
    const res = await useApi()<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload,
    })
    token.value = res.data.token
    user.value = res.data.user
  }

  async function fetchUser() {
    const res = await useApi()<{ data: { user: Record<string, any> } }>('/auth/me')
    user.value = res.data.user
  }

  async function logout() {
    try {
      await useApi()('/auth/logout', { method: 'POST' })
    } catch {
      // ignore — clear locally regardless
    }
    token.value = null
    user.value = null
    await navigateTo('/login')
  }

  async function updateProfile(payload: { name: string; phone: string }) {
    const res = await useApi()<{ data: { user: Record<string, any> } }>('/auth/profile', {
      method: 'PUT',
      body: payload,
    })
    user.value = res.data.user
  }

  async function updatePassword(payload: {
    current_password: string
    password: string
    password_confirmation: string
  }) {
    await useApi()('/auth/password', { method: 'PUT', body: payload })
  }

  async function updateNotifications(payload: {
    notify_on_received: boolean
    notify_on_status_change: boolean
    notify_on_closed: boolean
  }) {
    const res = await useApi()<{ data: { user: Record<string, any> } }>('/auth/notifications', {
      method: 'PUT',
      body: payload,
    })
    user.value = res.data.user
  }

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => {
    const roles = (user.value?.roles ?? []) as Array<{ name: string }>
    return roles.some((r) => ['admin', 'super_admin'].includes(r.name))
  })
  const isSuperAdmin = computed(() => {
    const roles = (user.value?.roles ?? []) as Array<{ name: string }>
    return roles.some((r) => r.name === 'super_admin')
  })
  const isRepresentative = computed(() => {
    const roles = (user.value?.roles ?? []) as Array<{ name: string }>
    return roles.some((r) => r.name === 'representative')
  })

  return {
    token,
    user,
    login,
    register,
    fetchUser,
    logout,
    updateProfile,
    updatePassword,
    updateNotifications,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isRepresentative,
  }
}
