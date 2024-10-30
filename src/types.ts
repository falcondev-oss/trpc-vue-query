import type {
  InfiniteData,
  InitialPageParam,
  QueryClient,
  QueryKey,
  UseInfiniteQueryOptions,
  UseInfiniteQueryReturnType,
  UseMutationOptions,
  UseMutationReturnType,
  UseQueriesResults,
  UseQueryOptions,
  UseQueryReturnType,
} from '@tanstack/vue-query'
import type { OperationContext, TRPCClientErrorLike, TRPCRequestOptions } from '@trpc/client'
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
import type { Unsubscribable } from '@trpc/server/observable'
import type { ProcedureOptions } from '@trpc/server/unstable-core-do-not-import'
import type { MaybeRefOrGetter, Ref, UnwrapRef } from 'vue'

type inferAsyncIterableYield<T> = T extends AsyncIterable<infer U> ? U : T

type TRPCSubscriptionObserver<TValue, TError> = {
  onStarted: (opts: { context: OperationContext | undefined }) => void
  onData: (value: inferAsyncIterableYield<TValue>) => void
  onError: (err: TError) => void
  onStopped: () => void
  onComplete: () => void
}

type ArrayElement<T> = T extends readonly unknown[] ? T[number] : never
type Primitive = null | undefined | string | number | boolean | symbol | bigint
export type Exact<Shape, T extends Shape> = Shape extends Primitive
  ? Shape
  : Shape extends object
    ? {
        [Key in keyof T]: Key extends keyof Shape
          ? T[Key] extends Date
            ? T[Key]
            : T[Key] extends unknown[]
              ? Array<Exact<ArrayElement<Shape[Key]>, ArrayElement<T[Key]>>>
              : T[Key] extends readonly unknown[]
                ? ReadonlyArray<Exact<ArrayElement<Shape[Key]>, ArrayElement<T[Key]>>>
                : T[Key] extends object
                  ? Exact<Shape[Key], T[Key]>
                  : T[Key]
          : never
      }
    : Shape

export type DecorateProcedure<
  TProcedure extends AnyTRPCProcedure,
  TRouter extends AnyTRPCRouter,
> = TProcedure extends AnyTRPCQueryProcedure
  ? {
      useQuery: <
        TQueryFnData extends inferTransformedProcedureOutput<TRouter, TProcedure>,
        TError extends TRPCClientErrorLike<TRouter>,
        TData extends TQueryFnData,
        TQueryData extends TQueryFnData,
        TQueryKey extends QueryKey,
        TInput extends inferProcedureInput<TProcedure>,
      >(
        input: MaybeRefOrGetter<Exact<inferProcedureInput<TProcedure>, TInput>>,
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
      useQueries: <
        TQueryFnData extends inferTransformedProcedureOutput<TRouter, TProcedure>,
        TError extends TRPCClientErrorLike<TRouter>,
        TData extends TQueryFnData,
        TQueryData extends TQueryFnData,
        TQueryKey extends QueryKey,
        TInput extends inferProcedureInput<TProcedure>,
        TQueries extends UseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
        TCombinedResult = UseQueriesResults<TQueries[]>,
      >(
        inputs: MaybeRefOrGetter<Exact<inferProcedureInput<TProcedure>, TInput>[]>,
        opts?: MaybeRefOrGetter<
          Omit<UnwrapRef<TQueries>, 'queryKey'> & {
            trpc?: TRPCRequestOptions
            queryKey?: never
            combine?: (result: UseQueriesResults<TQueries[]>) => TCombinedResult
            shallow?: boolean
          }
        >,
      ) => Readonly<Ref<TCombinedResult>>
      query: <TInput extends inferProcedureInput<TProcedure>>(
        input: Exact<inferProcedureInput<TProcedure>, TInput>,
        opts?: ProcedureOptions,
      ) => Promise<inferTransformedProcedureOutput<TRouter, TProcedure>>
      invalidate: <TInput extends inferProcedureInput<TProcedure>>(
        input?: MaybeRefOrGetter<Exact<inferProcedureInput<TProcedure>, TInput>>,
      ) => Promise<void>
      setQueryData: <TInput extends inferProcedureInput<TProcedure>>(
        updater: inferTransformedProcedureOutput<TRouter, TProcedure>,
        input?: MaybeRefOrGetter<Exact<inferProcedureInput<TProcedure>, TInput>>,
      ) => ReturnType<QueryClient['setQueryData']>
      key: <TInput extends inferProcedureInput<TProcedure>>(
        input?: MaybeRefOrGetter<Exact<inferProcedureInput<TProcedure>, TInput>>,
      ) => QueryKey
    } & (TProcedure['_def']['$types']['input'] extends { cursor?: infer CursorType }
      ? {
          useInfiniteQuery: <
            TQueryFnData extends inferTransformedProcedureOutput<TRouter, TProcedure>,
            TError extends TRPCClientErrorLike<TRouter>,
            TData extends InfiniteData<TQueryFnData>,
            TQueryData extends TQueryFnData,
            TQueryKey extends QueryKey,
            TInput extends inferProcedureInput<TProcedure>,
          >(
            input: MaybeRefOrGetter<Exact<Omit<inferProcedureInput<TProcedure>, 'cursor'>, TInput>>,
            opts?: MaybeRefOrGetter<
              Omit<
                UnwrapRef<
                  UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
                >,
                'queryKey' | keyof InitialPageParam
              > & {
                trpc?: TRPCRequestOptions
                queryKey?: TQueryKey
              } & (undefined extends TProcedure['_def']['$types']['input']['cursor']
                  ? Partial<InitialPageParam<CursorType>>
                  : InitialPageParam<CursorType>)
            >,
          ) => UseInfiniteQueryReturnType<TData, TError>
        }
      : object)
  : TProcedure extends AnyTRPCMutationProcedure
    ? {
        mutate: <TInput extends inferProcedureInput<TProcedure>>(
          input: Exact<inferProcedureInput<TProcedure>, TInput>,
          opts?: ProcedureOptions,
        ) => Promise<inferTransformedProcedureOutput<TRouter, TProcedure>>
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
          // for exact types, patch @tanstack/query-core `MutateFunction`
        ) => UseMutationReturnType<TData, TError, TVariables, TContext>
      }
    : TProcedure extends AnyTRPCSubscriptionProcedure
      ? {
          subscribe: <TInput extends inferProcedureInput<TProcedure>>(
            input: Exact<inferProcedureInput<TProcedure>, TInput>,
            opts: ProcedureOptions &
              Partial<
                TRPCSubscriptionObserver<
                  inferProcedureOutput<TProcedure>,
                  TRPCClientErrorLike<TRouter>
                >
              >,
          ) => Unsubscribable
          useSubscription: <TInput extends inferProcedureInput<TProcedure>>(
            input: MaybeRefOrGetter<Exact<inferProcedureInput<TProcedure>, TInput>>,
            opts: ProcedureOptions &
              Partial<
                TRPCSubscriptionObserver<
                  inferProcedureOutput<TProcedure>,
                  TRPCClientErrorLike<TRouter>
                >
              >,
          ) => Unsubscribable
        }
      : never

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
