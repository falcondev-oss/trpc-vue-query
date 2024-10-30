import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { applyWSSHandler } from '@trpc/server/adapters/ws'
import { WebSocketServer } from 'ws'
import { z } from 'zod'

import { publicProcedure, router } from './trpc'

export const appRouter = router({
  ping: publicProcedure.query(() => 'Pong!'),
  hello: publicProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .query(({ input }) => `Hello ${input.name}!`),

  emptyQuery: publicProcedure.query(() => null),
  emptyMutation: publicProcedure.mutation(() => null),

  count: publicProcedure
    .input(
      z.object({
        max: z.number(),
        delayMs: z.number().optional().default(100),
      }),
    )
    .subscription(async function* ({ input }) {
      let i = 1
      while (i <= input.max) {
        yield i
        i++
        await new Promise((resolve) => setTimeout(resolve, input.delayMs))
      }
    }),

  infinite: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100),
        cursor: z.number().default(0),
      }),
    )
    .query(({ input }) => {
      return {
        items: Array.from({ length: input.limit }, (_, i) => i + input.cursor),
      }
    }),
})

export type AppRouter = typeof appRouter

const server = createHTTPServer({
  router: appRouter,
})

const wss = new WebSocketServer({ server })
applyWSSHandler<AppRouter>({
  wss,
  router: appRouter,
})

server.listen(3000)
console.log(`Listening on http://localhost:3000`)
