export default defineNuxtPlugin(async () => {
  const { token, fetchUser } = useAuth()
  if (token.value) {
    try {
      await fetchUser()
    } catch {
      // token invalid/expired — useApi already clears it on 401
    }
  }
})
