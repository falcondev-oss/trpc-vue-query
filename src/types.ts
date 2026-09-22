import type {
  InfiniteData,
  InfiniteQueryObserverOptions,
  InitialPageParam,
  QueryClient,
  QueryKey,
  SkipToken,
  UseInfiniteQueryReturnType,
  UseMutationReturnType,
  UseQueriesResults,
  UseQueryReturnType,
  MutationOptions as VueMutationOptions,
  QueryOptions as VueQueryOptions,
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
import type { MaybeRefOrGetter, Ref } from 'vue'

type inferAsyncIterableYield<T> = T extends AsyncIterable<infer U> ? U : T

/** Not re-exported from vue-query's root, so we restate it. */
type ShallowOption = {
  shallow?: boolean
}

/** vue-query's plain `QueryOptions` minus the key, which we build from the procedure path. */
type KeylessQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
> = Omit<VueQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>, 'queryKey'>

/**
 * vue-query has no plain `QueryOptions` counterpart for infinite queries, so we assemble one the
 * same way it does: core observer options, whose `queryKey` is already plain, with `enabled`
 * widened to a ref or getter.
 */
type PlainKeyInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
> = {
  [
    Property in keyof InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  ]: Property extends 'enabled'
    ? MaybeRefOrGetter<
        InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>[Property]
      >
    : InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>[Property]
} & ShallowOption

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

// TODO: extract subtypes and use them as satisfies checks in index.ts
export type DecorateProcedure<
  TProcedure extends AnyTRPCProcedure,
  TRouter extends AnyTRPCRouter,
> = TProcedure extends AnyTRPCQueryProcedure
  ? {
      useQuery: <
        TQueryFnData extends inferTransformedProcedureOutput<TRouter, TProcedure>,
        TError extends TRPCClientErrorLike<TRouter>,
        TQueryData extends TQueryFnData,
        TQueryKey extends QueryKey,
        TInput extends inferProcedureInput<TProcedure>,
        TData = TQueryFnData,
      >(
        input: inferProcedureInput<TProcedure> extends void
          ? | inferProcedureInput<TProcedure>
            | Ref<inferProcedureInput<TProcedure> | SkipToken>
            | (() => inferProcedureInput<TProcedure> | SkipToken)
          : | Ref<Exact<inferProcedureInput<TProcedure>, TInput> | SkipToken>
            | (() => Exact<inferProcedureInput<TProcedure>, TInput> | SkipToken),
        opts?: MaybeRefOrGetter<
          KeylessQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> & {
            trpc?: TRPCRequestOptions
            queryKey?: TQueryKey
          }
        >,
      ) => UseQueryReturnType<TData, TError>
      useQueries: <
        TQueryFnData extends {
          output: inferTransformedProcedureOutput<TRouter, TProcedure>
          input: inferProcedureInput<TProcedure>
        },
        TError extends TRPCClientErrorLike<TRouter>,
        TQueryData extends TQueryFnData,
        TQueryKey extends QueryKey,
        TInput extends inferProcedureInput<TProcedure>,
        TQueries extends KeylessQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
        TData = TQueryFnData,
        TCombinedResult = UseQueriesResults<TQueries[]>,
      >(
        inputs: MaybeRefOrGetter<Exact<inferProcedureInput<TProcedure>, TInput>[]>,
        opts?: MaybeRefOrGetter<
          TQueries & {
            trpc?: TRPCRequestOptions
            queryKey?: never
            combine?: (result: UseQueriesResults<TQueries[]>) => TCombinedResult
            shallow?: boolean
          }
        >,
      ) => Readonly<Ref<TCombinedResult>>
      queryOptions: <
        TQueryFnData extends inferTransformedProcedureOutput<TRouter, TProcedure>,
        TError extends TRPCClientErrorLike<TRouter>,
        TQueryData extends TQueryFnData,
        TQueryKey extends QueryKey,
        TInput extends inferProcedureInput<TProcedure>,
        TData = TQueryFnData,
      >(
        input: inferProcedureInput<TProcedure> extends void
          ? | inferProcedureInput<TProcedure>
            | Ref<inferProcedureInput<TProcedure> | SkipToken>
            | (() => inferProcedureInput<TProcedure> | SkipToken)
          : | Ref<Exact<inferProcedureInput<TProcedure>, TInput> | SkipToken>
            | (() => Exact<inferProcedureInput<TProcedure>, TInput> | SkipToken),
        opts?: MaybeRefOrGetter<
          KeylessQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> & {
            trpc?: TRPCRequestOptions
            queryKey?: TQueryKey
          }
        >,
        // `queryClient.fetchQuery()` and its siblings take core options, so the key stays plain
      ) => () => KeylessQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & {
        queryKey: TQueryKey
      }
      query: <TInput extends inferProcedureInput<TProcedure>>(
        input: Exact<inferProcedureInput<TProcedure>, TInput>,
        opts?: TRPCRequestOptions,
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
            TQueryKey extends QueryKey,
            TInput extends inferProcedureInput<TProcedure>,
            TData extends InfiniteData<any> = InfiniteData<TQueryFnData>,
          >(
            input: MaybeRefOrGetter<Exact<Omit<inferProcedureInput<TProcedure>, 'cursor'>, TInput>>,
            opts?: MaybeRefOrGetter<
              Omit<
                PlainKeyInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, CursorType>,
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
          opts?: TRPCRequestOptions,
        ) => Promise<inferTransformedProcedureOutput<TRouter, TProcedure>>
        useMutation: <
          TData = inferTransformedProcedureOutput<TRouter, TProcedure>,
          TError = TRPCClientErrorLike<TRouter>,
          TVariables = inferProcedureInput<TProcedure>,
          TContext = unknown,
        >(
          opts?: MaybeRefOrGetter<
            VueMutationOptions<TData, TError, TVariables, TContext> & {
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
            opts: TRPCRequestOptions &
              Partial<
                TRPCSubscriptionObserver<
                  inferProcedureOutput<TProcedure>,
                  TRPCClientErrorLike<TRouter>
                >
              >,
          ) => Unsubscribable
          useSubscription: <TInput extends inferProcedureInput<TProcedure>>(
            input: MaybeRefOrGetter<Exact<inferProcedureInput<TProcedure>, TInput>>,
            opts: TRPCRequestOptions &
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
