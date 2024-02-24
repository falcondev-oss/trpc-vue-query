/* eslint-disable ts/no-unsafe-argument */
/* eslint-disable ts/no-unsafe-assignment */
/* eslint-disable ts/no-unsafe-return */
/* eslint-disable ts/no-unsafe-member-access */
/* eslint-disable ts/no-unsafe-call */
import { type QueryKey, useMutation, useQuery } from '@tanstack/vue-query'
import {
  type CreateTRPCClientOptions,
  createTRPCProxyClient,
  type inferRouterProxyClient,
} from '@trpc/client'
import { createFlatProxy, createRecursiveProxy } from '@trpc/server/shared'
import { computed, toRefs, toValue } from 'vue'

import type { DecoratedProcedureRecord } from './types'
import type { AnyRouter } from '@trpc/server'

function getQueryKey(path: string[], input: unknown): QueryKey {
  return input === undefined ? path : [...path, input]
}

function createVueQueryProxyDecoration<TRouter extends AnyRouter>(
  name: string,
  client: inferRouterProxyClient<TRouter>,
) {
  return createRecursiveProxy((opts) => {
    const args = opts.args

    const path = [name, ...opts.path]

    // The last arg is for instance `.useMutation` or `.useQuery`
    const lastProperty = path.pop()!

    const joinedPath = path.join('.')
    const [input, options] = args

    if (lastProperty === '_def') {
      return { path }
    }

    if (lastProperty === 'useQuery') {
      const { trpc, ...queryOptions } = options || ({} as any)

      return useQuery({
        queryKey: computed(() => getQueryKey(path, toValue(input))),
        queryFn: ({ queryKey, signal }) =>
          (client as any)[joinedPath].query(queryKey.at(-1), {
            signal,
            ...trpc,
          }),
        ...toRefs(queryOptions),
      })
    }

    if (lastProperty === 'useMutation') {
      const { trpc, ...mutationOptions } = options || ({} as any)

      return useMutation({
        mutationFn: (payload) =>
          (client as any)[joinedPath].mutate(payload, {
            ...trpc,
          }),
        ...toRefs(mutationOptions),
      })
    }

    return (client as any)[joinedPath][lastProperty](...args)
  })
}

export function createTRPCVueQueryClient<TRouter extends AnyRouter>(
  opts: CreateTRPCClientOptions<TRouter>,
) {
  const client = createTRPCProxyClient<TRouter>(opts)

  const decoratedClient = createFlatProxy<
    DecoratedProcedureRecord<TRouter['_def']['record'], TRouter>
  >((key) => {
    return createVueQueryProxyDecoration(key, client as any)
  })

  return decoratedClient
}
