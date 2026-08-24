/* eslint-disable ts/no-unsafe-argument */
/* eslint-disable ts/no-unsafe-return */
/* eslint-disable ts/no-unsafe-assignment */

import type { InfiniteQueryPageParamsOptions, QueryClient } from '@tanstack/vue-query'
import type { CreateTRPCClientOptions, TRPCRequestOptions, TRPCUntypedClient } from '@trpc/client'
import type { AnyTRPCRouter } from '@trpc/server'
import type { UnionToIntersection } from 'type-fest'
import type { MaybeRefOrGetter } from 'vue'
import type { DecoratedProcedureRecord, DecorateProcedure } from './types'
import {
  queryOptions as defineQueryOptions,
  skipToken,
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
} from '@tanstack/vue-query'

import { createTRPCUntypedClient } from '@trpc/client'
import { createTRPCFlatProxy } from '@trpc/server'
import { createRecursiveProxy } from '@trpc/server/unstable-core-do-not-import'
import { toRef, toRefs } from '@vueuse/core'
import { computed, isReactive, onScopeDispose, shallowRef, toValue, watch } from 'vue'

type QueryType = 'query' | 'queries' | 'infinite'
export type TRPCQueryKey = [readonly string[], { input?: unknown; type?: QueryType }?]

export { type Exact } from './types'

function getQueryKey(path: string[], input: unknown, type?: QueryType): TRPCQueryKey {
  const splitPath = path.flatMap((part) => part.split('.'))

  if (input === undefined && !type) {
    return splitPath.length > 0 ? [splitPath] : ([] as unknown as TRPCQueryKey)
  }

  return [
    splitPath,
    {
      ...(input !== undefined && input !== skipToken && { input }),
      ...(type && { type }),
    },
  ]
}

/**
 * Operation context key marking a request as vue-query-driven.
 * Registered globally via `Symbol.for()`, so it also works across duplicate installs.
 */
export const vueQueryContext = Symbol.for('trpc-vue-query.vueQueryContext')

export interface VueQueryContext {}

declare module '@trpc/client' {
  interface OperationContext {
    [vueQueryContext]?: VueQueryContext
  }
}

function withVueQueryContext(trpcOptions: TRPCRequestOptions | undefined) {
  return {
    ...trpcOptions,
    context: { ...trpcOptions?.context, [vueQueryContext]: {} },
  } satisfies TRPCRequestOptions
}

// `opts` is a `MaybeRefOrGetter`, so it has to be unwrapped before the `trpc` key can be split off
function splitTRPCOptions(opts: MaybeRefOrGetter<any>) {
  const { trpc: trpcOptions, ...options } = toValue(opts) || {}
  return { trpcOptions: trpcOptions as TRPCRequestOptions | undefined, options }
}

function maybeToRefs(obj: MaybeRefOrGetter<Record<string, unknown>>) {
  // use https://vueuse.org/shared/toRefs to also support a ref of an object
  return toRefs(isReactive(obj) ? obj : toRef(obj))
}

function createVueQueryProxyDecoration<TRouter extends AnyTRPCRouter>(
  name: string,
  trpc: TRPCUntypedClient<TRouter>,
  queryClient: QueryClient,
) {
  return createRecursiveProxy(({ args, path: _path }) => {
    const path = [name, ..._path]

    // The last arg is for instance `.useMutation` or `.useQuery`
    const prop = path.pop()! as keyof UnionToIntersection<DecorateProcedure<any, TRouter>> | '_def'

    if (prop === '_def') {
      return { path }
    }

    const joinedPath = path.join('.')
    const [firstArg, ...rest] = args
    const opts = rest[0] || ({} as any)

    if (prop === 'query') {
      return trpc.query(joinedPath, firstArg, opts)
    }

    function createQuery(
      _input: MaybeRefOrGetter<unknown>,
      _opts: MaybeRefOrGetter<any>,
      { type = 'query' }: { type?: QueryType } = {},
    ) {
      return defineQueryOptions(() => {
        const input = toValue(_input)
        const { trpcOptions, options } = splitTRPCOptions(_opts)

        return {
          queryKey: getQueryKey(path, input, type),
          queryFn:
            input === skipToken
              ? skipToken
              : async ({ signal }) => {
                  const output = await trpc.query(joinedPath, input, {
                    signal,
                    ...withVueQueryContext(trpcOptions),
                  })

                  if (type === 'queries') return { output, input }

                  return output
                },
          ...options,
        }
      })
    }
    if (prop === 'useQuery') {
      return useQuery(createQuery(firstArg, opts))
    }

    if (prop === 'queryOptions') {
      return createQuery(firstArg, opts)
    }

    if (prop === 'useQueries') {
      const inputs = firstArg as MaybeRefOrGetter<unknown[]>
      // vue-query reads `combine` and `shallow` once at setup, so a reactive `opts` only updates the per-query options
      const { combine, shallow } = toValue(opts) || {}
      const queryOpts = () => {
        const { combine: _, shallow: __, ...perQueryOptions } = toValue(opts) || {}
        return perQueryOptions
      }

      return useQueries({
        queries: computed(() =>
          toValue(inputs).map((i) => createQuery(i, queryOpts, { type: 'queries' })()),
        ),
        combine,
        shallow,
      })
    }

    if (prop === 'invalidate') {
      return queryClient.invalidateQueries({
        queryKey: getQueryKey(path, toValue(firstArg), 'query'),
      })
    }

    if (prop === 'setQueryData') {
      return queryClient.setQueryData(getQueryKey(path, toValue(opts), 'query'), firstArg)
    }

    if (prop === 'key') {
      return getQueryKey(path, toValue(firstArg), 'query')
    }

    if (prop === 'mutate') {
      return trpc.mutation(joinedPath, firstArg, opts)
    }
    if (prop === 'useMutation') {
      return useMutation({
        mutationKey: computed(() => getQueryKey(path, undefined)),
        mutationFn: async (payload) =>
          trpc.mutation(
            joinedPath,
            payload,
            withVueQueryContext(splitTRPCOptions(firstArg).trpcOptions),
          ),
        ...maybeToRefs(() => splitTRPCOptions(firstArg).options),
      })
    }

    if (prop === 'subscribe') {
      return trpc.subscription(joinedPath, firstArg, opts)
    }
    if (prop === 'useSubscription') {
      const inputData = toRef(firstArg)

      const subscription = shallowRef<ReturnType<(typeof trpc)['subscription']>>()
      watch(
        inputData,
        () => {
          if (inputData.value === skipToken) return

          subscription.value?.unsubscribe()

          subscription.value = trpc.subscription(joinedPath, inputData.value, {
            ...opts,
          })
        },
        { immediate: true },
      )

      onScopeDispose(() => {
        subscription.value?.unsubscribe()
      }, true)

      return subscription.value!
    }

    if (prop === 'useInfiniteQuery') {
      return useInfiniteQuery({
        queryKey: computed(() => getQueryKey(path, toValue(firstArg), 'infinite')),
        queryFn: async ({ queryKey, pageParam, signal }) =>
          trpc.query(
            joinedPath,
            {
              ...(queryKey[1]?.input as object),
              cursor: pageParam,
            },
            {
              signal,
              ...withVueQueryContext(splitTRPCOptions(opts).trpcOptions),
            },
          ),
        ...(maybeToRefs(() => splitTRPCOptions(opts).options) as InfiniteQueryPageParamsOptions),
      })
    }

    // return (trpc as any)[joinedPath][prop](...args)
    throw new Error(`Method '.${prop as string}()' not supported`)
  })
}

export function createTRPCVueQueryClient<TRouter extends AnyTRPCRouter>({
  trpc,
  queryClient,
}: {
  queryClient: QueryClient
  trpc: CreateTRPCClientOptions<TRouter>
}) {
  const client = createTRPCUntypedClient<TRouter>(trpc)

  const decoratedClient = createTRPCFlatProxy<
    DecoratedProcedureRecord<TRouter['_def']['record'], TRouter>
  >((key) => {
    return createVueQueryProxyDecoration(key.toString(), client, queryClient)
  })

  return decoratedClient
}
