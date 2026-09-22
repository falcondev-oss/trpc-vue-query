import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { test } from 'vitest'
import { ref } from 'vue'

import { app, useTRPC } from './vue-app'

test('queryOptions() feeds useQuery and the imperative QueryClient methods', () => {
  void app.runWithContext(async () => {
    const trpc = useTRPC()
    const queryClient = useQueryClient()

    const options = trpc.hello.queryOptions(() => ({ name: 'World' }))
    useQuery(options)
    await queryClient.ensureQueryData(options())
    await queryClient.fetchQuery(options())
    await queryClient.prefetchQuery(options())

    const withOpts = trpc.hello.queryOptions(
      () => ({ name: 'World' }),
      () => ({ retry: false }),
    )
    useQuery(withOpts)
    await queryClient.ensureQueryData(withOpts())
    await queryClient.fetchQuery(withOpts())
    await queryClient.prefetchQuery(withOpts())
  })
})

test('options are the core ones, so per-property refs are rejected', () => {
  void app.runWithContext(() => {
    const trpc = useTRPC()

    trpc.hello.queryOptions(
      () => ({ name: 'World' }),
      () => ({ staleTime: 1000, enabled: () => true }),
    )
    trpc.hello.queryOptions(
      () => ({ name: 'World' }),
      // @ts-expect-error a ref here would reach the core QueryClient, which cannot unwrap it
      () => ({ staleTime: ref(1000) }),
    )
  })
})

test('useQuery and useInfiniteQuery take the same core options', () => {
  void app.runWithContext(() => {
    const trpc = useTRPC()

    trpc.hello.useQuery(
      () => ({ name: 'World' }),
      () => ({ retry: false, staleTime: 1000, enabled: () => true, shallow: true }),
    )
    trpc.infinite.useInfiniteQuery(
      () => ({ limit: 10 }),
      () => ({ initialPageParam: 0, getNextPageParam: () => 1, staleTime: 1000 }),
    )
  })
})
