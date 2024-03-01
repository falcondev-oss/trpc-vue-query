import { createHTTPServer } from '@trpc/server/adapters/standalone'

import { publicProcedure, router } from './trpc'

export const appRouter = router({
  ping: publicProcedure.query(() => 'Pong!'),
})

export type AppRouter = typeof appRouter

const server = createHTTPServer({
  router: appRouter,
})

const { port } = server.listen(3000)
console.log(`Listening on http://localhost:${port}`)
