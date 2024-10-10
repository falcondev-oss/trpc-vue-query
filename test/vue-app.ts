import { VueQueryPlugin, useQueryClient } from '@tanstack/vue-query'
import { createWSClient, httpLink, splitLink, wsLink } from '@trpc/client'
import { createApp, inject } from 'vue'
import { WebSocket } from 'ws'

import { createTRPCVueQueryClient } from '../src/index'

import type { AppRouter } from './trpc/index'
import type { InjectionKey } from 'vue'

const trpcKey = Symbol('trpc') as InjectionKey<
  ReturnType<typeof createTRPCVueQueryClient<AppRouter>>
>

export const app = createApp({})

// eslint-disable-next-line ts/no-unsafe-assignment
globalThis.WebSocket = WebSocket as any

const apiUrl = 'http://localhost:3000/'
const wsClient = createWSClient({ url: apiUrl.replace('http', 'ws') })

app.use(VueQueryPlugin)
app.use({
  install() {
    const queryClient = app.runWithContext(useQueryClient)
    const trpc = createTRPCVueQueryClient<AppRouter>({
      queryClient,
      trpc: {
        links: [
          splitLink({
            condition: (op) => op.type === 'subscription',
            true: wsLink({
              client: wsClient,
            }),
            false: httpLink({
              url: apiUrl,
            }),
          }),
        ],
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
