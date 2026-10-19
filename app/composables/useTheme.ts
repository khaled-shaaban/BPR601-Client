type Theme = 'light' | 'dark'

/**
 * Light/dark theme, defaulting to dark. The chosen theme is stored in the
 * `theme` cookie and applied as `data-theme` on <html>; an inline head script
 * (see nuxt.config) sets it before first paint to avoid a flash, and PrimeVue
 * follows via its `[data-theme="dark"]` darkModeSelector.
 */
export function useTheme() {
  const cookie = useCookie<Theme>('theme', {
    default: () => 'dark',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  const theme = useState<Theme>('theme', () => cookie.value || 'dark')

  function apply(value: Theme) {
    if (import.meta.client) document.documentElement.setAttribute('data-theme', value)
  }

  function set(value: Theme) {
    theme.value = value
    cookie.value = value
    apply(value)
  }

  function toggle() {
    set(theme.value === 'dark' ? 'light' : 'dark')
  }

  function init() {
    theme.value = cookie.value || 'dark'
    apply(theme.value)
  }

  return { theme, set, toggle, init }
}
