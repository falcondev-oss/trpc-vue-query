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

### 5. Reactive parameters

Input parameters can be refs — the query refetches when they change.

```vue
<script lang="ts" setup>
const productId = ref(1)
const { data: product } = useTRPC().product.getById.useQuery(productId)
</script>
```

## Helpers

### `invalidate()`

Invalidate and refetch a query.

```vue
<script lang="ts" setup>
const trpc = useTRPC()
const { mutate: addToCart } = trpc.cart.addProduct.useMutation({
  onSuccess: () => {
    // this will invalidate and refetch the `cart.get` query
    trpc.cart.get.invalidate()
  },
})
</script>
```

### `setQueryData()`

Update the query data manually.

```vue
<script lang="ts" setup>
const trpc = useTRPC()
const { mutate: addToCart } = trpc.cart.addProduct.useMutation({
  onSuccess: (newCart) => {
    // this will update the `cart.get` query data
    trpc.cart.get.setQueryData(newCart)
  },
})
</script>
```

### `key()`

Get the query key. With the key you can access all the other TanStack Query features.

```vue
<script lang="ts" setup>
const trpc = useTRPC()
const cartKey = trpc.cart.get.key()

const productKey = trpc.product.getById.key(1)

// eg. cancel queries by key:
const queryClient = useQueryClient()
await queryClient.cancelQueries({ queryKey: cartKey })
</script>
```

## Operation context

Every request made through a vue-query composable (`useQuery`, `useQueries`, `useInfiniteQuery`, `useMutation`, `queryOptions`) is marked with the exported `vueQueryContext` symbol in the tRPC [operation context](https://trpc.io/docs/client/links#managing-context). Plain `query()` / `mutate()` calls are not.

The symbol is declaration-merged into tRPC's `OperationContext` interface, so `op.context[vueQueryContext]` is typed inside links.

Links can use this to skip handling that vue-query already does, e.g. error toasts coming from the query/mutation cache:

```ts
import { vueQueryContext } from '@falcondev-oss/trpc-vue-query'

const errorToastLink: TRPCLink<AppRouter> =
  () =>
  ({ op, next }) =>
    observable((observer) =>
      next(op).subscribe({
        next: (value) => observer.next(value),
        complete: () => observer.complete(),
        error(err) {
          // vue-query requests are toasted by the query/mutation cache instead
          if (!(vueQueryContext in op.context)) toast.error(err.message)
          observer.error(err)
        },
      }),
    )
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
