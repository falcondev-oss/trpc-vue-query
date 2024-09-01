/* eslint-disable ts/no-unsafe-argument, ts/no-unsafe-assignment, ts/no-unsafe-return, ts/no-unsafe-member-access, ts/no-unsafe-call */
import { type QueryClient, type QueryKey, useMutation, useQuery } from '@tanstack/vue-query'
import {
  type CreateTRPCClientOptions,
  createTRPCClient,
  type inferRouterClient,
} from '@trpc/client'
import { createTRPCFlatProxy } from '@trpc/server'
import { createRecursiveProxy } from '@trpc/server/unstable-core-do-not-import'
import { toRef, toRefs, toValue } from '@vueuse/core'
import { computed, isReactive } from 'vue'

import type { DecoratedProcedureRecord } from './types'
import type { AnyTRPCRouter } from '@trpc/server'
import type { MaybeRefOrGetter } from '@vueuse/core'

function getQueryKey(path: string[], input: unknown): QueryKey {
  return input === undefined ? path : [...path, input]
}

function maybeToRefs(obj: MaybeRefOrGetter<Record<string, unknown>>) {
  // use https://vueuse.org/shared/toRefs to also support a ref of an object
  return isReactive(obj) ? toRefs(obj) : toRefs(toRef(obj))
}

function createVueQueryProxyDecoration<TRouter extends AnyTRPCRouter>(
  name: string,
  client: inferRouterClient<TRouter>,
  queryClient: QueryClient,
) {
  return createRecursiveProxy((opts) => {
    const args = opts.args

    const path = [name, ...opts.path]

    // The last arg is for instance `.useMutation` or `.useQuery`
    const lastProperty = path.pop()!

    const joinedPath = path.join('.')
    const [firstParam, secondParam] = args

    if (lastProperty === '_def') {
      return { path }
    }

    if (lastProperty === 'useQuery') {
      const { trpc, ...queryOptions } = secondParam || ({} as any)

      return useQuery({
        queryKey: computed(() => getQueryKey(path, toValue(firstParam))),
        queryFn: ({ queryKey, signal }) =>
          (client as any)[joinedPath].query(queryKey.at(-1), {
            signal,
            ...trpc,
          }),
        ...maybeToRefs(queryOptions),
      })
    }

    if (lastProperty === 'invalidate') {
      return queryClient.invalidateQueries({
        queryKey: getQueryKey(path, toValue(firstParam)),
      })
    }

    if (lastProperty === 'setQueryData') {
      return queryClient.setQueryData(getQueryKey(path, toValue(secondParam)), firstParam)
    }

    if (lastProperty === 'key') {
      return getQueryKey(path, toValue(firstParam))
    }

    if (lastProperty === 'useMutation') {
      const { trpc, ...mutationOptions } = firstParam || ({} as any)

      return useMutation({
        mutationFn: (payload) =>
          (client as any)[joinedPath].mutate(payload, {
            ...trpc,
          }),
        ...maybeToRefs(mutationOptions),
      })
    }

    return (client as any)[joinedPath][lastProperty](...args)
  })
}

export function createTRPCVueQueryClient<TRouter extends AnyTRPCRouter>(opts: {
  queryClient: QueryClient
  trpc: CreateTRPCClientOptions<TRouter>
}) {
  const client = createTRPCClient<TRouter>(opts.trpc)

  const decoratedClient = createTRPCFlatProxy<
    DecoratedProcedureRecord<TRouter['_def']['record'], TRouter>
  >((key) => {
    return createVueQueryProxyDecoration(key, client as any, opts.queryClient)
  })

  return decoratedClient
}
