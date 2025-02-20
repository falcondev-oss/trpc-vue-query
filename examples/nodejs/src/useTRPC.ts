import { inject } from 'vue'

import type { AppRouter } from '../server'
import type { createTRPCVueQueryClient } from '@falcondev-oss/trpc-vue-query'

export function useTRPC() {
  return inject('trpc') as ReturnType<typeof createTRPCVueQueryClient<AppRouter>>
}
