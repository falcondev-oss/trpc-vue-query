import { createApp } from 'vue';
import App from './App.vue';
import { createTRPCVueQueryClient } from '@falcondev-oss/trpc-vue-query'
import { VueQueryPlugin, useQueryClient } from '@tanstack/vue-query'
import { AppRouter } from '../server';
import { httpBatchLink } from '@trpc/client';

    

const app = createApp(App);
app.use(VueQueryPlugin);
app.use({
    install(app) {
      const queryClient = app.runWithContext(useQueryClient)
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
  
      app.provide('trpc', trpc)
    },
  })

app.mount('#app');