export default defineNuxtConfig({
  app: {
    head: {
      title: "Dofus Helper",

      htmlAttrs: { lang: "en" },

      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },

  compatibilityDate: "2025-07-15",

  devtools: { enabled: true },

  modules: ["@nuxt/fonts", "@nuxtjs/tailwindcss", "@vueuse/nuxt", "@nuxtjs/i18n"],

  runtimeConfig: {
    equipmentsApiBase: process.env.EQUIPMENTS_API_BASE,
    public: {},
  },

  i18n: {
  locales: [
    { code: 'en', file: 'en.json' },
    { code: 'fr', file: 'fr.json' }
  ],
  defaultLocale: 'en',
  langDir: 'locales',
  strategy: 'prefix_except_default'
 }
});
