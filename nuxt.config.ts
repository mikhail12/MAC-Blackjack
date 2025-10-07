import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      geminiDefaultModel:
        process.env.NUXT_PUBLIC_GEMINI_DEFAULT_MODEL ?? 'gemini-2.5-flash',
      PAGE_LIMIT: process.env.PAGE_LIMIT ?? "5",
    },
  },
  app: {
    head: {
      title: 'Blackjack',
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/spade-card.ico' },
      ],
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  modules: [
    'shadcn-nuxt',
    '@nuxtjs/color-mode',
    '@nuxt/icon',
    'radix-vue/nuxt',
    '@nuxt/test-utils/module',
    '@nuxtjs/supabase',
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui'
  },
  colorMode: {
    classSuffix: ''
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    secretKey: process.env.SUPABASE_SECRET_KEY,
    redirectOptions: {
      login: '/',
      callback: '/confirm',
      include: undefined,
      exclude: [],
      saveRedirectToCookie: true,
    }
  },
})