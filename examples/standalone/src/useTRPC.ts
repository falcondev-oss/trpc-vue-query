import { createTRPCVueQueryClient } from '@falcondev-oss/trpc-vue-query'
import { AppRouter } from '../server'
import { inject } from 'vue'

export function useTRPC() {
  return inject('trpc') as ReturnType<typeof createTRPCVueQueryClient<AppRouter>>
}