# tRPC Vue Query

<a href="https://npmjs.org/package/@falcondev-oss/trpc-vue-query" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@falcondev-oss/trpc-vue-query.svg" alt="NPM version" /></a>

A tRPC wrapper around @tanstack/vue-query. This package provides a set of hooks to use tRPC with Vue Query.

## Installation

```bash
pnpm add @falcondev-oss/trpc-vue-query
```

## Documentation

👉 <https://trpc-vue-query.falcondev.io/getting-started> 👈

## Usage with Vue

### 1. Create client & composable

```ts
import { createTRPCVueQueryClient } from '@falcondev-oss/trpc-vue-query'
import { VueQueryPlugin, useQueryClient } from '@tanstack/vue-query'

import type { AppRouter } from '../your_server/trpc'

app.use(VueQueryPlugin)
app.use({
  install(app) {
    const queryClient = app.runWithContext(useQueryClient)
    const trpc = createTRPCVueQueryClient<AppRouter>({
      queryClient,
      trpc: {
        links: [
          httpBatchLink({
            url: '/api/trpc',
          }),
        ],
      },
    })

    app.provide('trpc', trpc)
  },
})
```

```ts
import { createTRPCVueQueryClient } from '@falcondev-oss/trpc-vue-query'

import type { AppRouter } from '../your_server/trpc'

export function useTRPC() {
  return inject('trpc') as ReturnType<typeof createTRPCVueQueryClient<AppRouter>>
}
```

### 2. Use it in your components

```vue
<script lang="ts" setup>
const { data: greeting } = useTRPC().hello.useQuery({ name: 'World' })
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
const { data: greeting } = useTRPC().hello.useQuery(
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
const { mutate: updateGreeting } = useTRPC().hello.update.useMutation({
  onSuccess: () => {
    console.log('Greeting updated')
  },
})
</script>

<template>
  <div>
    <input v-model="name" type="text" />
    <button @click="() => updateGreeting({ name })">Update greeting</button>
  </div>
</template>
```

## Usage with `trpc-nuxt`

Setup `trpc-nuxt` as described in their [documentation](https://trpc-nuxt.vercel.app/get-started/usage/recommended). Then update the `plugins/client.ts` file:

```ts
import { createTRPCVueQueryClient } from '@falcondev-oss/trpc-vue-query'
import { useQueryClient } from '@tanstack/vue-query'
import { httpBatchLink } from 'trpc-nuxt/client'

import type { AppRouter } from '~/server/trpc/routers'

export default defineNuxtPlugin(() => {
  const queryClient = useQueryClient()

  // ⬇️ use `createTRPCVueQueryClient` instead of `createTRPCNuxtClient` ⬇️
  const trpc = createTRPCVueQueryClient<AppRouter>({
    queryClient,
    trpc: {
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    },
  })

  return {
    provide: {
      trpc,
    },
  }
})
```

```ts
export function useTRPC() {
  return useNuxtApp().$trpc
}
```

## Acknowledgements

Huge thanks to [Robert Soriano](https://github.com/wobsoriano) for creating `trpc-nuxt`! We just adapted his work to work with Vue Query.
