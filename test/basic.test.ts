import type { TRPCQueryKey } from '../src/index'
import { keepPreviousData, skipToken } from '@tanstack/vue-query'
import { until } from '@vueuse/core'
import { describe, expect, test, vi } from 'vitest'
import { isReadonly, ref, toValue } from 'vue'
import { app, useTRPC } from './vue-app'

test('query()', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()

    const pong = await trpc.hello.query({ name: 'World' })

    expect(pong).toEqual('Hello World!')
  })
})

test('queryOptions()', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()
    const options = trpc.hello.queryOptions(() => ({ name: 'Pong' }), {
      placeholderData: keepPreviousData,
      meta: {
        test: 'meta value',
      },
    })()

    expect(options.queryKey).toEqual([
      ['hello'],
      {
        input: {
          name: 'Pong',
        },
        type: 'query',
      },
    ])
    expect(options.placeholderData).toBe(keepPreviousData)
    expect(options.meta).toEqual({ test: 'meta value' })
  })
})

test('queryOptions() with getter opts', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()
    const staleTime = ref(1000)
    const options = trpc.hello.queryOptions(
      () => ({ name: 'Pong' }),
      () => ({ meta: { test: 'meta value' }, staleTime: staleTime.value }),
    )

    expect(options().meta).toEqual({ test: 'meta value' })
    expect(options().staleTime).toBe(1000)

    staleTime.value = 2000
    expect(options().staleTime).toBe(2000)
  })
})

test('key()', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()

    const key = toValue(trpc.hello.key(() => ({ name: 'Pong' })))

    expect(key).toEqual([
      ['hello'],
      {
        input: {
          name: 'Pong',
        },
        type: 'query',
      },
    ])
  })
})

describe('useQuery()', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()

    const pong = trpc.hello.useQuery(() => ({ name: 'Pong' }), {
      placeholderData: keepPreviousData,
      suspense: true,
    })

    await pong.suspense()

    expect(pong.data.value).toEqual('Hello Pong!')
  })

  test('empty', async () => {
    await app.runWithContext(async () => {
      const trpc = useTRPC()

      const empty = trpc.emptyQuery.useQuery()

      await empty.suspense()

      expect(empty.data.value).toBeNull()

      const empty2 = await trpc.emptyQuery.query()
      expect(empty2).toBeNull()
    })
  })

  test('skipToken', async () => {
    await app.runWithContext(async () => {
      const trpc = useTRPC()

      const name = ref<string | undefined>(undefined)
      const pong = trpc.hello.useQuery(() => (name.value ? { name: name.value } : skipToken))

      expect(pong.fetchStatus.value).toStrictEqual('idle')
      expect(pong.data.value).toBeUndefined()

      name.value = 'World'
      expect(pong.status.value).toStrictEqual('pending')
      await vi.waitUntil(() => pong.status.value === 'success')

      expect(pong.data.value).toStrictEqual('Hello World!')
    })
  })
})

test('useMutation()', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()

    const onSuccess = vi.fn()
    const result = trpc.emptyMutation.useMutation(() => ({ onSuccess }))

    await result.mutateAsync()

    expect(result.data.value).toBeNull()
    expect(onSuccess).toHaveBeenCalledOnce()
  })
})

test('useMutation() with getter opts', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()

    const onSuccess = vi.fn()
    const handler = ref(onSuccess)
    const result = trpc.emptyMutation.useMutation(() => ({ onSuccess: handler.value }))

    await result.mutateAsync()
    expect(onSuccess).toHaveBeenCalledOnce()

    const nextHandler = vi.fn()
    handler.value = nextHandler

    await result.mutateAsync()
    expect(nextHandler).toHaveBeenCalledOnce()
  })
})

test('useMutation() re-reads trpc options from the getter', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()

    const controller = ref(new AbortController())
    const result = trpc.emptyMutation.useMutation(() => ({
      trpc: { signal: controller.value.signal },
    }))

    await expect(result.mutateAsync()).resolves.toBeNull()

    const aborted = new AbortController()
    aborted.abort()
    controller.value = aborted

    await expect(result.mutateAsync()).rejects.toThrow()
  })
})

test('mutate()', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()

    const result = await trpc.emptyMutation.mutate()

    expect(result).toBeNull()
  })
})

test('useInfiniteQuery()', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()

    const infinite = trpc.infinite.useInfiniteQuery(
      { limit: 10 },
      {
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.items.length + 1,
        placeholderData: keepPreviousData,
        suspense: true,
      },
    )

    await infinite.suspense()

    console.log(infinite.data.value?.pages)

    expect(infinite.data.value?.pages).toHaveLength(1)
    expect(infinite.data.value?.pageParams).toStrictEqual([1])

    await infinite.fetchNextPage()

    expect(infinite.data.value?.pages).toHaveLength(2)
    expect(infinite.data.value?.pageParams).toStrictEqual([1, 11])
  })
})

test('useInfiniteQuery() with getter input and opts', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()

    const limit = ref(2)
    const infinite = trpc.infinite.useInfiniteQuery(
      () => ({ limit: limit.value }),
      () => ({
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.items.length + 1,
        suspense: true,
      }),
    )

    await infinite.suspense()
    expect(infinite.data.value?.pages[0]?.items).toHaveLength(2)

    limit.value = 5
    await until(() => infinite.data.value?.pages[0]?.items.length).toBe(5)
  })
})

test('useInfiniteQuery() reads input from the getter, not the query key', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()

    // a custom key carries no input, so the call only resolves if queryFn uses the getter's input
    const infinite = trpc.infinite.useInfiniteQuery(
      () => ({ limit: 3 }),
      () => ({
        queryKey: [['custom']] as TRPCQueryKey,
        initialPageParam: 0,
        getNextPageParam: () => null,
        suspense: true,
      }),
    )

    await infinite.suspense()
    expect(infinite.data.value?.pages[0]?.items).toHaveLength(3)
  })
})

test('subscribe()', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()

    const mockFn = vi.fn()

    const subscription = trpc.count.subscribe(
      { max: 5 },
      {
        onStarted() {
          console.log('Started')
        },
        onData(value) {
          console.log('Data:', value)
          mockFn(value)
        },
        onError(err) {
          console.error('Error:', err)
        },
        onStopped() {
          console.log('Stopped')
        },
        onComplete() {
          console.log('Completed')
        },
      },
    )

    await new Promise((resolve) => setTimeout(resolve, 450))

    expect(mockFn).toHaveBeenCalledTimes(5)
    expect(mockFn).toHaveBeenLastCalledWith(5)

    subscription.unsubscribe()
  })
})

test('useSubscription()', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()

    const mockFn = vi.fn()

    const input = ref({ max: 5 })
    const subscription = trpc.count.useSubscription(input, {
      onStarted() {
        console.log('Started')
      },
      onData(value) {
        console.log('Data:', value)
        mockFn(value)
      },
      onError(err) {
        console.error('Error:', err)
      },
      onStopped() {
        console.log('Stopped')
      },
      onComplete() {
        console.log('Completed')
      },
    })

    await new Promise((resolve) => setTimeout(resolve, 450))

    expect(mockFn).toHaveBeenCalledTimes(5)
    expect(mockFn).toHaveBeenLastCalledWith(5)

    subscription.unsubscribe()
  })
})

test('useQueries()', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()

    const hellos = Array.from({ length: 5 }, (_, i) => ({ name: i.toString() }))

    const queries = trpc.hello.useQueries(() => hellos, {
      suspense: true,
      combine: (results) => {
        return {
          data: results.map((result) => result.data),
          pending: results.some((result) => result.isPending),
        }
      },
    })

    await until(() => queries.value.pending).toBe(false)

    expect(queries.value.data.map((d) => d?.output)).toEqual(
      hellos.map((hello) => `Hello ${hello.name}!`),
    )
    // `shallow` defaults to off, so the combined result is deeply readonly
    expect(isReadonly(queries.value.data)).toBe(true)
  })
})
