import tailwindcss from "@tailwindcss/vite";

// Runs before first paint so the saved theme and font scale are already on
// <html>. Without it every load flashes the default dark theme at 100%.
const themeBootstrap = `
try {
  var d = document.documentElement;
  var t = localStorage.getItem('app-theme') || 'system';
  var resolved = t === 'system'
    ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : t;
  d.setAttribute('data-theme', resolved);
  var s = { sm: '87.5%', md: '100%', lg: '112.5%', xl: '125%' }[localStorage.getItem('font-scale') || 'md'];
  if (s) d.style.fontSize = s;
} catch (e) {}
`;

export default defineNuxtConfig({
  app: {
    head: {
      title: "Dofus Helper",

      htmlAttrs: { lang: "en" },

      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],

      script: [{ innerHTML: themeBootstrap, tagPriority: "critical" }],
    },
  },

  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  fonts: {
    families: [
      { name: "Inter", provider: "google", weights: [400, 500, 600, 700] },
    ],
  },

  compatibilityDate: "2025-07-15",

  devtools: { enabled: true },

  nitro: {
    externals: {
      traceInclude: [
        "./node_modules/tesseract.js-core/**/*",
        "./node_modules/.pnpm/tesseract.js-core@*/node_modules/tesseract.js-core/**/*",
      ],
    },
  },

  modules: ["@nuxt/fonts", "@vueuse/nuxt", "@nuxtjs/i18n"],

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
    strategy: 'prefix_except_default',
    vueI18n: './i18n.config.ts'
  }
});
