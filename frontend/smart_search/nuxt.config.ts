// nuxt.config.ts
export default defineNuxtConfig({
  app: {
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
        }
      ]
    },
  },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],
  
  css: [
    './assets/css/main.css',
  ],
  
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
 
  // Configuration SSR pour Vercel
  ssr: true,
 
  // Configuration des variables d'environnement
  runtimeConfig: {
    // Variables privées (côté serveur uniquement)
    apiBaseUrl: process.env.NUXT_API_BASE_URL || 'https://smartsearch.myfad.org',
    apiKey: process.env.NUXT_API_KEY || '',
    
    // Variables publiques (côté client et serveur)
    public: {
      // Utilise le proxy pour éviter les problèmes CORS
      apiBaseUrl: '/api/smartsearch',
      environment: process.env.NODE_ENV || 'development',
      appVersion: process.env.npm_package_version || '1.0.0'
    }
  },
  
  // Configuration Nitro pour Vercel avec optimisations
  nitro: {
    preset: 'vercel',
    // Configuration Vercel pour les timeouts
    vercel: {
      functions: {
        maxDuration: 30
      }
    },
    // Configuration des headers globaux
    routeRules: {
      '/api/**': { 
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key'
        },
        prerender: false 
      }
    }
  },

  // Configuration du build pour optimiser pour Vercel
  build: {
    // Réduire la taille du bundle
    extractCSS: true,
  },

  // Configuration expérimentale pour améliorer les performances
  experimental: {
    payloadExtraction: false // Désactiver pour éviter les problèmes sur Vercel
  },

  // Configuration des hooks pour le debugging
  hooks: {
    'build:before': () => {
      console.log('🏗️  Building for production...')
    },
    'nitro:config': (nitroConfig) => {
      console.log('⚡ Nitro preset:', nitroConfig.preset)
    }
  }
})