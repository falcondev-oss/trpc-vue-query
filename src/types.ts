import type {
  InfiniteData,
  InitialPageParam,
  QueryClient,
  QueryKey,
  UseInfiniteQueryOptions,
  UseInfiniteQueryReturnType,
  UseMutationOptions,
  UseMutationReturnType,
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
import type { MaybeRefOrGetter, UnwrapRef } from 'vue'

type TRPCSubscriptionObserver<TValue, TError> = {
  onStarted: (opts: { context: OperationContext | undefined }) => void
  onData: (value: TValue) => void
  onError: (err: TError) => void
  onStopped: () => void
  onComplete: () => void
}

export type Exact<Shape, T extends Shape> = {
  [Key in keyof T]: Key extends keyof Shape
    ? T[Key] extends Date
      ? T[Key]
      : T[Key] extends object
        ? Exact<Shape[Key], T[Key]>
        : T[Key]
    : never
}

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
        TTInput extends TInput,
      >(
        input: MaybeRefOrGetter<Exact<TInput, TTInput>>,
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
      query: <TInput extends inferProcedureInput<TProcedure>, TTInput extends TInput>(
        input: Exact<TInput, TTInput>,
        opts?: ProcedureOptions,
      ) => Promise<inferTransformedProcedureOutput<TRouter, TProcedure>>
      invalidate: <TInput extends inferProcedureInput<TProcedure>, TTInput extends TInput>(
        input?: MaybeRefOrGetter<Exact<TInput, TTInput>>,
      ) => Promise<void>
      setQueryData: <TInput extends inferProcedureInput<TProcedure>, TTInput extends TInput>(
        updater: inferTransformedProcedureOutput<TRouter, TProcedure>,
        input?: MaybeRefOrGetter<Exact<TInput, TTInput>>,
      ) => ReturnType<QueryClient['setQueryData']>
      key: <TInput extends inferProcedureInput<TProcedure>, TTInput extends TInput>(
        input?: MaybeRefOrGetter<Exact<TInput, TTInput>>,
      ) => QueryKey
    } & (TProcedure['_def']['$types']['input'] extends { cursor?: infer CursorType }
      ? {
          useInfiniteQuery: <
            TQueryFnData extends inferTransformedProcedureOutput<TRouter, TProcedure>,
            TError extends TRPCClientErrorLike<TRouter>,
            TData extends InfiniteData<TQueryFnData>,
            TQueryData extends TQueryFnData,
            TQueryKey extends QueryKey,
            TInput extends Omit<inferProcedureInput<TProcedure>, 'cursor'>,
            TTInput extends TInput,
          >(
            input: MaybeRefOrGetter<Exact<TInput, TTInput>>,
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
        mutate: <TInput extends inferProcedureInput<TProcedure>, TTInput extends TInput>(
          input: Exact<TInput, TTInput>,
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
        ) => UseMutationReturnType<TData, TError, TVariables, TContext>
      }
    : TProcedure extends AnyTRPCSubscriptionProcedure
      ? {
          subscribe: <TInput extends inferProcedureInput<TProcedure>, TTInput extends TInput>(
            input: Exact<TInput, TTInput>,
            opts: ProcedureOptions &
              Partial<
                TRPCSubscriptionObserver<
                  inferProcedureOutput<TProcedure>,
                  TRPCClientErrorLike<TRouter>
                >
              >,
          ) => Unsubscribable
          useSubscription: <TInput extends inferProcedureInput<TProcedure>, TTInput extends TInput>(
            input: MaybeRefOrGetter<Exact<TInput, TTInput>>,
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
