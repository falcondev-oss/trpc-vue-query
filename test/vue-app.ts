import { VueQueryPlugin, useQueryClient } from '@tanstack/vue-query'
import { httpBatchLink } from '@trpc/client'
import { createApp, inject } from 'vue'

import { createTRPCVueQueryClient } from '../src/index'

import type { AppRouter } from './trpc/index'
import type { InjectionKey } from 'vue'

const trpcKey = Symbol('trpc') as InjectionKey<
  ReturnType<typeof createTRPCVueQueryClient<AppRouter>>
>

export const app = createApp({})

app.use(VueQueryPlugin)
app.use({
  install() {
    const queryClient = app.runWithContext(useQueryClient)
    const trpc = createTRPCVueQueryClient<AppRouter>({
      queryClient,
      trpc: {
        links: [httpBatchLink({ url: 'http://localhost:3000' })],
      },
    })

    app.provide(trpcKey, trpc)
  },
})

export function useTRPC() {
  const trpc = inject(trpcKey)
  if (!trpc) throw new Error('tRPC client is not available.')

  return trpc
}
