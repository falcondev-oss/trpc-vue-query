import { createTRPCVueQueryClient } from '@falcondev-oss/trpc-vue-query'
import { VueQueryPlugin, useQueryClient } from '@tanstack/vue-query'
import { httpBatchLink } from '@trpc/client'
import { createApp } from 'vue'

import App from './App.vue'

import type { AppRouter } from '../server'
import type { Component } from 'vue'

const app = createApp(App as Component)
app.use(VueQueryPlugin)
app.use({
  install(vueAppInstance) {
    const queryClient = vueAppInstance.runWithContext(useQueryClient)
    const trpc = createTRPCVueQueryClient<AppRouter>({
      queryClient,
      trpc: {
        links: [
          httpBatchLink({
            url: '/api/trpc',
          }),
        ],
      },
    })

    vueAppInstance.provide('trpc', trpc)
  },
})

app.mount('#app')
