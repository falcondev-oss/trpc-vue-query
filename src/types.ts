import type {
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
import type { MaybeRef, MaybeRefOrGetter, UnwrapRef } from 'vue'

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
        ResT = inferTransformedProcedureOutput<TProcedure>,
        DataE = TRPCClientErrorLike<TProcedure>,
        DataT = ResT,
        KeyT extends QueryKey = QueryKey,
      >(
        input: MaybeRefOrGetter<inferProcedureInput<TProcedure>>,
        opts?: MaybeRef<
          Omit<UnwrapRef<UseQueryOptions<ResT, DataT>>, 'queryKey'> & {
            trpc?: TRPCRequestOptions
            queryKey?: KeyT
          }
        >,
      ) => UseQueryReturnType<DataT, DataE>
      query: Resolver<TProcedure>
    }
  : TProcedure extends AnyMutationProcedure
    ? {
        mutate: Resolver<TProcedure>
        useMutation: <
          ResT = inferTransformedProcedureOutput<TProcedure>,
          DataE = TRPCClientErrorLike<TProcedure>,
          DataT = ResT,
          VariablesT = inferProcedureInput<TProcedure>,
          ContextT = unknown,
        >(
          opts?: UseMutationOptions<DataT, DataE, VariablesT, ContextT> & {
            trpc?: TRPCRequestOptions
          },
        ) => UseMutationReturnType<DataT, DataE, VariablesT, ContextT>
      }
    : TProcedure extends AnySubscriptionProcedure
      ? {
          subscribe: SubscriptionResolver<TProcedure, TRouter>
        }
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
