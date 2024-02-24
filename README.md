# tRPC Vue Query

A tRPC wrapper around @tanstack/vue-query. This package provides a set of hooks to use tRPC with Vue Query.

## Installation

```bash
pnpm add @falcondev-it/trpc-vue-query
```

## Usage

### 1. Create client

```ts
import { createTRPCVueQueryClient } from '@falcondev-it/trpc-vue-query'
import type { AppRouter } from '../your_server/trpc'

export const trpc = createTRPCVueQueryClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
    }),
  ],
})
```

### 2. Use it in your components

```vue
<script lang="ts" setup>
const { data: greeting } = trpc.hello.useQuery({ name: 'World' })
</script>
<template>
  <div>
    <h1>{{ greeting }}</h1>
  </div>
</template>
```

### 3. Passing vue-query options

```vue
<script lang="ts" setup>
const { data: greeting } = trpc.hello.useQuery(
  { name: 'World' },
  {
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  },
)
</script>

<template>
  <div>
    <h1>{{ greeting }}</h1>
  </div>
</template>
```

### 4. Using the `useMutation` hook

```vue
<script lang="ts" setup>
const name = ref('')
const { mutate: updateGreeting } = trpc.hello.update.useMutation({
  onSuccess: () => {
    console.log('Greeting updated')
  },
})
</script>

<template>
  <div>
    <input v-model="name" type="text" />
    <button @click="updateGreeting({ name })">Update greeting</button>
  </div>
</template>
```

## Usage with `trpc-nuxt`

Setup `trpc-nuxt` as described in their [documentation](https://trpc-nuxt.vercel.app/get-started/usage/recommended). Then update the `plugins/client.ts` file:

```ts
import { createTRPCVueQueryClient } from '@falcondev-it/trpc-vue-query'
import { httpBatchLink } from 'trpc-nuxt/client'
import type { AppRouter } from '~/server/trpc/routers'

export default defineNuxtPlugin(() => {
  // ⬇️ use `createTRPCVueQueryClient` instead of `createTRPCNuxtClient` ⬇️
  const client = createTRPCVueQueryClient<AppRouter>({
    links: [
      httpBatchLink({
        url: '/api/trpc',
      }),
    ],
  })

  return {
    provide: {
      client,
    },
  }
})
```

## Acknowledgements

Huge thanks to [Robert Soriano](https://github.com/wobsoriano) for creating `nuxt-trpc`! We just adapted his work to work with Vue Query.
