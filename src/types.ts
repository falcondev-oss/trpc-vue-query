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
  AnyTRPCMutationProcedure,
  AnyTRPCProcedure,
  AnyTRPCQueryProcedure,
  AnyTRPCRouter,
  AnyTRPCSubscriptionProcedure,
  inferProcedureInput,
  inferProcedureOutput,
  inferTransformedProcedureOutput,
} from '@trpc/server'
import type { Unsubscribable, inferObservableValue } from '@trpc/server/observable'
import type { ProcedureOptions } from '@trpc/server/unstable-core-do-not-import'
import type { MaybeRefOrGetter, UnwrapRef } from 'vue'

type TRPCSubscriptionObserver<TValue, TError> = {
  onStarted: () => void
  onData: (value: TValue) => void
  onError: (err: TError) => void
  onStopped: () => void
  onComplete: () => void
}

type Resolver<TRouter extends AnyTRPCRouter, TProcedure extends AnyTRPCProcedure> = (
  input: inferProcedureInput<TProcedure>,
  opts?: ProcedureOptions,
) => Promise<inferTransformedProcedureOutput<TRouter, TProcedure>>

type SubscriptionResolver<TProcedure extends AnyTRPCProcedure, TRouter extends AnyTRPCRouter> = (
  input: inferProcedureInput<TProcedure>,
  opts: ProcedureOptions &
    Partial<
      TRPCSubscriptionObserver<
        inferObservableValue<inferProcedureOutput<TProcedure>>,
        TRPCClientErrorLike<TRouter>
      >
    >,
) => Unsubscribable

export type DecorateProcedure<
  TProcedure extends AnyTRPCProcedure,
  TRouter extends AnyTRPCRouter,
> = TProcedure extends AnyTRPCQueryProcedure
  ? {
      useQuery: <
        TQueryFnData = inferTransformedProcedureOutput<TRouter, TProcedure>,
        TError = TRPCClientErrorLike<TRouter>,
        TData = TQueryFnData,
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
      query: Resolver<TRouter, TProcedure>
      invalidate: (input?: MaybeRefOrGetter<inferProcedureInput<TProcedure>>) => Promise<void>
      setQueryData: (
        updater: inferTransformedProcedureOutput<TRouter, TProcedure>,
        input?: MaybeRefOrGetter<inferProcedureInput<TProcedure>>,
      ) => ReturnType<QueryClient['setQueryData']>
      key: (input?: MaybeRefOrGetter<inferProcedureInput<TProcedure>>) => QueryKey
    }
  : TProcedure extends AnyTRPCMutationProcedure
    ? {
        mutate: Resolver<TRouter, TProcedure>
        useMutation: <
          TData = inferTransformedProcedureOutput<TRouter, TProcedure>,
          TError = TRPCClientErrorLike<TRouter>,
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
    : TProcedure extends AnyTRPCSubscriptionProcedure
      ? { subscribe: SubscriptionResolver<TProcedure, TRouter> }
      : 'test'

/**
 * @internal
 */
export type DecoratedProcedureRecord<
  TProcedures extends Record<string, any>,
  TRouter extends AnyTRPCRouter,
> = {
  [K in keyof TProcedures]: TProcedures[K] extends AnyTRPCProcedure
    ? DecorateProcedure<TProcedures[K], TRouter>
    : DecoratedProcedureRecord<TProcedures[K], TRouter>
}
