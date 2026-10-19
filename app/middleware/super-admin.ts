export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated, isSuperAdmin } = useAuth()
  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
  if (!isSuperAdmin.value) {
    return navigateTo('/reports')
  }
})
