import { keepPreviousData } from '@tanstack/vue-query'
import { expect, test, vi } from 'vitest'
import { ref } from 'vue'

import { app, useTRPC } from './vue-app'

test('query()', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()

    const pong = await trpc.hello.query({ name: 'World' })

    expect(pong).toEqual('Hello World!')
  })
})

test('useQuery()', async () => {
  await app.runWithContext(async () => {
    const trpc = useTRPC()

    const pong = trpc.hello.useQuery(
      { name: 'Pong' },
      {
        placeholderData: keepPreviousData,
        suspense: true,
      },
    )

    await pong.suspense()

    expect(pong.data.value).toEqual('Hello Pong!')
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
