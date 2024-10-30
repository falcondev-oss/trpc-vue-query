/* eslint-disable ts/no-unsafe-argument */
/* eslint-disable ts/no-unsafe-assignment */

import {
  type InfiniteQueryPageParamsOptions,
  type QueryClient,
  queryOptions as defineQueryOptions,
  skipToken,
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
} from '@tanstack/vue-query'
import {
  type CreateTRPCClientOptions,
  type TRPCUntypedClient,
  createTRPCUntypedClient,
} from '@trpc/client'
import { createTRPCFlatProxy } from '@trpc/server'
import { createRecursiveProxy } from '@trpc/server/unstable-core-do-not-import'
import { toRef, toRefs, toValue } from '@vueuse/core'
import { computed, isReactive, onScopeDispose, shallowRef, watch } from 'vue'

import type { DecorateProcedure, DecoratedProcedureRecord } from './types'
import type { AnyTRPCRouter } from '@trpc/server'
import type { MaybeRefOrGetter } from '@vueuse/core'
import type { UnionToIntersection } from 'type-fest'

type QueryType = 'query' | 'infinite'
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

function maybeToRefs(obj: MaybeRefOrGetter<Record<string, unknown>>) {
  // use https://vueuse.org/shared/toRefs to also support a ref of an object
  return isReactive(obj) ? toRefs(obj) : toRefs(toRef(obj))
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

    const joinedPath = path.join('.')
    const [firstArg, ...rest] = args
    const opts = rest[0] || ({} as any)

    if (prop === '_def') {
      return { path }
    }

    if (prop === 'query') {
      return trpc.query(joinedPath, firstArg, opts)
    }

    function createQuery(
      input: MaybeRefOrGetter<unknown>,
      { trpcOptions, queryOptions }: { trpcOptions: any; queryOptions: any },
    ) {
      return defineQueryOptions({
        queryKey: computed(() => getQueryKey(path, toValue(input), 'query')),
        queryFn: async ({ queryKey, signal }) =>
          trpc.query(joinedPath, queryKey[1]?.input, {
            signal,
            ...trpcOptions,
          }),
        ...maybeToRefs(queryOptions),
      })
    }
    if (prop === 'useQuery') {
      const { trpc: trpcOptions, ...queryOptions } = opts
      const input = firstArg

      return useQuery(createQuery(input, { trpcOptions, queryOptions }))
    }

    if (prop === 'useQueries') {
      const { trpc: trpcOptions, combine, shallow, ...queryOptions } = opts
      const inputs = firstArg as MaybeRefOrGetter<unknown[]>

      return useQueries({
        queries: computed(() =>
          toValue(inputs).map((i) => createQuery(i, { trpcOptions, queryOptions })),
        ),
        combine,
        ...maybeToRefs({ shallow }),
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
      const { trpc: trpcOptions, ...mutationOptions } = firstArg || ({} as any)

      return useMutation({
        mutationKey: computed(() => getQueryKey(path, undefined)),
        mutationFn: async (payload) =>
          trpc.mutation(joinedPath, payload, {
            ...trpcOptions,
          }),
        ...maybeToRefs(mutationOptions),
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
      const { trpc: trpcOptions, ...queryOptions } = opts

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
              ...trpcOptions,
            },
          ),
        ...(maybeToRefs(queryOptions) as InfiniteQueryPageParamsOptions),
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
    return createVueQueryProxyDecoration(key, client, queryClient)
  })

  return decoratedClient
}
