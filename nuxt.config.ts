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

  modules: ["@nuxt/fonts", "@nuxtjs/tailwindcss", "@vueuse/nuxt"],

  runtimeConfig: {
    metamobApiKey: process.env.METAMOB_API_KEY,
    equipmentsApiBase: process.env.EQUIPMENTS_API_BASE,
    public: {},
  },
});
