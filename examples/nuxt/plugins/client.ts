import { createTRPCVueQueryClient } from '@falcondev-oss/trpc-vue-query'
import type {
  DehydratedState,
  VueQueryPluginOptions,
} from '@tanstack/vue-query'
import {
  QueryClient,
  VueQueryPlugin,
  dehydrate,
  hydrate,
} from '@tanstack/vue-query'
import { httpBatchLink } from 'trpc-nuxt/client'
import type { AppRouter } from '~/server/api/trpc/[trpc]'
// Nuxt 3 app aliases
import { defineNuxtPlugin, useState } from '#imports'


/**
   * createTRPCNuxtClient adds a `useQuery` composable
   * built on top of `useAsyncData`.
   */
const trpc = (queryClient: QueryClient) => {

  // ⬇️ use `createTRPCVueQueryClient` instead of `createTRPCNuxtClient` ⬇️
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
  return trpc;
}

declare module "#app" {
  interface NuxtApp {
    $trpc: ReturnType<typeof trpc>;
  }
}

export default defineNuxtPlugin((nuxt) => {
  const vueQueryState = useState<DehydratedState | null>('vue-query')
  
    // Modify your Vue Query global settings here
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: 5000 } },
    })
    const options: VueQueryPluginOptions = { queryClient }
  
    nuxt.vueApp.use(VueQueryPlugin, options)
  
    if (import.meta.server) {
      nuxt.hooks.hook('app:rendered', () => {
        vueQueryState.value = dehydrate(queryClient)
      })
    }
  
    if (import.meta.client) {
      hydrate(queryClient, vueQueryState.value)
    }

  return {
    provide: {
      trpc: trpc(queryClient),
    },
  }
})
