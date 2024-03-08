/* eslint-disable ts/no-unsafe-argument, ts/no-unsafe-assignment, ts/no-unsafe-return, ts/no-unsafe-member-access, ts/no-unsafe-call */
import { type QueryKey, useMutation, useQuery } from '@tanstack/vue-query'
import {
  type CreateTRPCClientOptions,
  createTRPCProxyClient,
  type inferRouterProxyClient,
} from '@trpc/client'
import { createFlatProxy, createRecursiveProxy } from '@trpc/server/shared'
import { toRef, toRefs, toValue } from '@vueuse/core'
import { computed, getCurrentInstance, isReactive } from 'vue'

import type { DecoratedProcedureRecord } from './types'
import type { AnyRouter } from '@trpc/server'
import type { MaybeRefOrGetter } from '@vueuse/core'

function getQueryKey(path: string[], input: unknown): QueryKey {
  return input === undefined ? path : [...path, input]
}

function maybeToRefs(obj: MaybeRefOrGetter<Record<string, unknown>>) {
  // use https://vueuse.org/shared/toRefs to also support a ref of an object
  return isReactive(obj) ? toRefs(obj) : toRefs(toRef(obj))
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
        ...maybeToRefs(queryOptions),
      })
    }

    if (lastProperty === 'useMutation') {
      const vueApp = getCurrentInstance()?.appContext.app
      const mutationOptionsWithContext = Object.fromEntries(
        Object.entries(mutationOptions).map(([key, value]) => {
          if (typeof value !== 'function' || !vueApp) return [key, value]
          return [key, (...fnArgs: any[]) => vueApp.runWithContext(() => value(...fnArgs))]
        }),
      )

      return useMutation({
        mutationFn: (payload) =>
          (client as any)[joinedPath].mutate(payload, {
            ...trpc,
          }),
        ...maybeToRefs(mutationOptionsWithContext),
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
