export default defineNuxtPlugin(() => {
  // Sync theme state + <html data-theme> from the saved cookie on boot.
  useTheme().init()
})
