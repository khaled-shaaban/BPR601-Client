// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'

const AppPreset = definePreset(Aura, {
  semantic: {
    // Brand — deep teal-green ramp
    primary: {
      50: '#e8f2f0', 100: '#c9e0dc', 200: '#a3ccc5', 300: '#74b3aa', 400: '#47978c',
      500: '#1f7a6e', 600: '#0f6055', 700: '#0a4a41', 800: '#073b34', 900: '#00332e', 950: '#002420',
    },
    colorScheme: {
      light: {
        // Pin PrimeVue's accents to the brand teal (not the mid-ramp default).
        primary: {
          color: '#00332e',
          contrastColor: '#ffffff',
          hoverColor: '#004d44',
          activeColor: '#002420',
        },
        highlight: {
          background: '#e6efed',
          focusBackground: '#d3e2df',
          color: '#00332e',
          focusColor: '#002420',
        },
      },
      dark: {
        // Match the dark UI: brightened teal accents on teal-charcoal surfaces.
        primary: {
          color: '#47b39d',
          contrastColor: '#05231e',
          hoverColor: '#5cc4af',
          activeColor: '#86dcca',
        },
        highlight: {
          background: 'rgba(71, 179, 157, .16)',
          focusBackground: 'rgba(71, 179, 157, .24)',
          color: '#a9e5d8',
          focusColor: '#c9f0e8',
        },
        surface: {
          0: '#ffffff', 50: '#f4f7f6', 100: '#e2e9e6', 200: '#c3d0cb', 300: '#9db0a9', 400: '#6f847c',
          500: '#4a5b54', 600: '#31423b', 700: '#223029', 800: '#152420', 900: '#0f1c18', 950: '#0a1411',
        },
      },
    },
  },
})

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  modules: ['@primevue/nuxt-module'],
  primevue: {
    // Don't auto-import PrimeVue's useToast — it would shadow the app's own
    // composables/useToast.ts (whose .success/.error/.info the whole UI uses).
    composables: { exclude: ['useToast'] },
    options: {
      theme: {
        preset: AppPreset,
        options: { darkModeSelector: '[data-theme="dark"]' },
      },
    },
  },
  css: ['~/assets/css/main.css', 'leaflet/dist/leaflet.css', 'primeicons/primeicons.css'],
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:8000/api',
      // Notifications are delivered by polling (no WebSocket). How often the
      // client checks for new notifications, in ms. Override via
      // NUXT_PUBLIC_NOTIFICATIONS_POLL_MS.
      notificationsPollMs: '25000',
    },
  },
  app: {
    head: {
      title: 'منصة البلاغات',
      htmlAttrs: { lang: 'ar', dir: 'rtl' },
      script: [
        {
          innerHTML:
            "(function(){try{var m=document.cookie.match(/(?:^|; )theme=(dark|light)/);document.documentElement.setAttribute('data-theme',m?m[1]:'dark')}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()",
          tagPosition: 'head',
        },
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#00332e' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
  },
})
