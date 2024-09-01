/* eslint-disable no-empty-pattern */
import { keepPreviousData } from '@tanstack/vue-query'
import { test as base, expect } from 'vitest'

import { app, useTRPC } from './vue-app'

const test = base.extend<{
  trpc: ReturnType<typeof useTRPC>
}>({
  trpc: [
    async ({}, use) => {
      await app.runWithContext(async () => {
        const trpc = useTRPC()
        await use(trpc)
      })
    },
    { auto: true },
  ],
})

test('useQuery()', async ({ trpc }) => {
  const _trpc = useTRPC()

  const pong = trpc.ping.useQuery(undefined, {
    placeholderData: keepPreviousData,
  })
  // const query = useQuery({
  //   queryKey: ['ping'],
  //   queryFn: () => 2,
  //   placeholderData: keepPreviousData,
  // })
  //query.data
  //pong.data
  await pong.suspense()
  expect(pong.data.value).toEqual('Pong!')
})
