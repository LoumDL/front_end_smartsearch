// nuxt.config.ts
export default defineNuxtConfig({
  // Configuration pour GitHub Pages
  app: {
    baseURL: '/front_end_smartsearch/', // nom de votre repository
    buildAssetsDir: 'assets',
    head: {
      title: 'IFAD Assistant Halki',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Assistant virtuel IFAD Halki' }
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
          integrity: 'sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==',
          crossorigin: 'anonymous'
        },
        // Favicon avec le bon chemin pour GitHub Pages
        { 
          rel: 'icon', 
          type: 'image/x-icon', 
          href: '/front_end_smartsearch/favicon.ico' 
        }
      ]
    },
  },

  // Modules existants
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  // CSS existant
  css: [
    './assets/css/main.css',
  ],

  // PostCSS existant
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  // Configuration pour génération statique GitHub Pages
  ssr: false, // ou true selon vos besoins
  target: 'static',

  // Configuration Nitro pour la génération
  nitro: {
    prerender: {
      routes: ['/'], // Ajoutez toutes vos routes ici
      crawlLinks: true
    }
  },

  // Génération pour pages statiques
  generate: {
    fallback: true
  },

  // Configuration pour éviter les problèmes de routage
  router: {
    base: '/front_end_smartsearch/'
  }
})