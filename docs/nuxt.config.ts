// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ['@nuxt/ui-pro'],
  modules: ['@nuxt/content', '@nuxt/ui', '@nuxt/fonts', '@nuxthq/studio'],
  hooks: {
    // Define `@nuxt/ui` components as global to use them in `.md` (feel free to add those you need)
    'components:extend': (components) => {
      const globals = components.filter((c) => ['UButton', 'UIcon'].includes(c.pascalName))

      for (const c of globals) {
        c.global = true
      }
    },
  },
  ui: {
    icons: ['heroicons', 'simple-icons'],
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/'],
    },
    preset: 'cloudflare-pages',
  },
  routeRules: {
    '/api/search.json': { prerender: true },
  },
  content: {
    highlight: {
      langs: [
        'js',
        'jsx',
        'json',
        'ts',
        'tsx',
        'vue',
        'css',
        'html',
        'vue',
        'bash',
        'md',
        'mdc',
        'yml',
        'yaml',
        'dockerfile',
        'csharp',
      ],
    },
  },
  devtools: {
    enabled: true,
  },
  typescript: {
    strict: true,
  },
})
