import { settings } from './shared/config'
import { iconNames } from './shared/icons'

export default defineNuxtConfig({
  compatibilityDate: '2025-09-01',
  ssr: false,
  // Hash routes support static hosts, deep links, and the offline presentation.
  router: { options: { hashMode: true } },
  devtools: { enabled: false },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  ui: { fonts: false },
  colorMode: { preference: 'system', fallback: 'light', storageKey: 'folio-fms-color-mode' },
  icon: { provider: 'none', clientBundle: { icons: iconNames.map((name) => 'lucide:' + name) } },
  experimental: { appManifest: false, payloadExtraction: false },
  vite: { build: { cssCodeSplit: false, modulePreload: false } },
  hooks: {
    'nitro:config'(config) {
      if (!config.static) return
      const prerender = (config.prerender ??= {})
      prerender.routes = [...(prerender.routes ?? []), '/api/demo.json']
    },
  },
  runtimeConfig: { public: { appName: settings.name } },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'theme-color', content: '#302653' },
        { name: 'description', content: 'Employee products, services, and order tracking.' },
      ],
    },
  },
})
