import { httpBatchLink } from '@trpc/client'

import { createTRPCVueQueryClient } from '../../src/index'

import type { AppRouter } from './index'

export const trpc = createTRPCVueQueryClient<AppRouter>({
  links: [httpBatchLink({ url: 'http://localhost:3000' })],
})
