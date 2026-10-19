/**
 * Returns a configured $fetch instance pointed at the Laravel API.
 * Attaches the bearer token, drives the top loading bar for mutations,
 * and redirects to /login on 401.
 */
export function useApi() {
  const config = useRuntimeConfig()
  const token = useAuthToken()
  const indicator = useLoadingIndicator()
  const isMutation = (method?: string) => !!method && method.toUpperCase() !== 'GET'

  return $fetch.create({
    baseURL: config.public.apiBase,
    headers: { Accept: 'application/json' },
    onRequest({ options }) {
      if (isMutation(options.method)) indicator.start()
      if (token.value) {
        options.headers = new Headers(options.headers)
        options.headers.set('Authorization', `Bearer ${token.value}`)
      }
    },
    onResponse({ options }) {
      if (isMutation(options.method)) indicator.finish()
    },
    onResponseError({ options, response }) {
      if (isMutation(options.method)) indicator.finish()
      if (response.status === 401) {
        token.value = null
        const user = useState('auth_user')
        user.value = null
        if (useRoute().path !== '/login') {
          navigateTo('/login')
        }
      }
    },
  })
}
