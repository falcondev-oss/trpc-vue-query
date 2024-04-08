import type {
  QueryClient,
  QueryKey,
  UseMutationOptions,
  UseMutationReturnType,
  UseQueryOptions,
  UseQueryReturnType,
} from '@tanstack/vue-query'
import type { TRPCClientErrorLike, TRPCRequestOptions } from '@trpc/client'
import type {
  AnyMutationProcedure,
  AnyProcedure,
  AnyQueryProcedure,
  AnyRouter,
  AnySubscriptionProcedure,
  ProcedureArgs,
  ProcedureRouterRecord,
  inferProcedureInput,
  inferProcedureOutput,
} from '@trpc/server'
import type { Unsubscribable, inferObservableValue } from '@trpc/server/observable'
import type { inferTransformedProcedureOutput } from '@trpc/server/shared'
import type { MaybeRefOrGetter, UnwrapRef } from 'vue'

type TRPCSubscriptionObserver<TValue, TError> = {
  onStarted: () => void
  onData: (value: TValue) => void
  onError: (err: TError) => void
  onStopped: () => void
  onComplete: () => void
}

type Resolver<TProcedure extends AnyProcedure> = (
  ...args: ProcedureArgs<TProcedure['_def']>
) => Promise<inferTransformedProcedureOutput<TProcedure>>

type SubscriptionResolver<TProcedure extends AnyProcedure, TRouter extends AnyRouter> = (
  ...args: [
    input: ProcedureArgs<TProcedure['_def']>[0],
    opts: ProcedureArgs<TProcedure['_def']>[1] &
      Partial<
        TRPCSubscriptionObserver<
          inferObservableValue<inferProcedureOutput<TProcedure>>,
          TRPCClientErrorLike<TRouter>
        >
      >,
  ]
) => Unsubscribable

export type DecorateProcedure<
  TProcedure extends AnyProcedure,
  TRouter extends AnyRouter,
> = TProcedure extends AnyQueryProcedure
  ? {
      useQuery: <
        TQueryFnData,
        TError = TRPCClientErrorLike<TProcedure>,
        TData = inferTransformedProcedureOutput<TProcedure>,
        TQueryData = TQueryFnData,
        TQueryKey extends QueryKey = QueryKey,
      >(
        input: MaybeRefOrGetter<inferProcedureInput<TProcedure>>,
        opts?: MaybeRefOrGetter<
          Omit<
            UnwrapRef<UseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>>,
            'queryKey'
          > & {
            trpc?: TRPCRequestOptions
            queryKey?: TQueryKey
          }
        >,
      ) => UseQueryReturnType<TData, TError>
      query: Resolver<TProcedure>
      invalidate: (input?: MaybeRefOrGetter<inferProcedureInput<TProcedure>>) => Promise<void>
      setQueryData: (
        updater: inferTransformedProcedureOutput<TProcedure>,
        input?: MaybeRefOrGetter<inferProcedureInput<TProcedure>>,
      ) => ReturnType<QueryClient['setQueryData']>
      key: (input?: MaybeRefOrGetter<inferProcedureInput<TProcedure>>) => QueryKey
    }
  : TProcedure extends AnyMutationProcedure
    ? {
        mutate: Resolver<TProcedure>
        useMutation: <
          TData = inferTransformedProcedureOutput<TProcedure>,
          TError = TRPCClientErrorLike<TProcedure>,
          TVariables = inferProcedureInput<TProcedure>,
          TContext = unknown,
        >(
          opts?: MaybeRefOrGetter<
            UseMutationOptions<TData, TError, TVariables, TContext> & {
              trpc?: TRPCRequestOptions
            }
          >,
        ) => UseMutationReturnType<TData, TError, TVariables, TContext>
      }
    : TProcedure extends AnySubscriptionProcedure
      ? { subscribe: SubscriptionResolver<TProcedure, TRouter> }
      : never

/**
 * @internal
 */
export type DecoratedProcedureRecord<
  TProcedures extends ProcedureRouterRecord,
  TRouter extends AnyRouter,
> = {
  [TKey in keyof TProcedures]: TProcedures[TKey] extends AnyRouter
    ? DecoratedProcedureRecord<TProcedures[TKey]['_def']['record'], TRouter>
    : TProcedures[TKey] extends AnyProcedure
      ? DecorateProcedure<TProcedures[TKey], TRouter>
      : never
}
