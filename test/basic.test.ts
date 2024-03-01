import { VueQueryPlugin } from '@tanstack/vue-query'
import { expect, test } from 'vitest'
import { createApp } from 'vue'

import { trpc } from './trpc/client'

const app = createApp({})
app.use(VueQueryPlugin)

test('useQuery()', async () => {
  await app.runWithContext(async () => {
    const pong = trpc.ping.useQuery()
    await pong.suspense()
    expect(pong.data.value).toEqual('Pong!')
  })
})
