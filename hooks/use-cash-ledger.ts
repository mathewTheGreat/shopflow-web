import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { cashLedgerService, PostDepositInput, CashLedgerLeg, InitializeRegisterInput } from "@/services/cash-ledger.service"
import { ListParams, PagedResult } from "@/types/list"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"

export function useRegisterAccounts(shopId: string | undefined) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["cash-ledger", "accounts", shopId],
        queryFn: () => {
            if (!shopId) return []
            return cashLedgerService.listAccounts(shopId)
        },
        enabled: !!shopId,
    })

    return {
        accounts: data ?? [],
        isLoading,
        error,
        refetch,
    }
}

export function useRegisterInitialization(shopId: string | undefined) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["cash-ledger", "initialization", shopId],
        queryFn: () => {
            if (!shopId) return null
            return cashLedgerService.getInitialization(shopId)
        },
        enabled: !!shopId,
    })

    return {
        initialization: data ?? null,
        initialized: data?.initialized ?? false,
        accounts: data?.accounts ?? [],
        isLoading,
        error,
        refetch,
    }
}

export function useInitializeRegister() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: InitializeRegisterInput) =>
            cashLedgerService.initializeRegister({
                ...data,
                requestId: data.requestId || uuidv4(),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cash-ledger"] })
            queryClient.invalidateQueries({ queryKey: ["shop", "money-position"] })
            queryClient.invalidateQueries({ queryKey: ["current-shift"] })
            toast.success("Register opening balances saved")
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to save opening balances")
        },
    })
}

export function useLedgerStatement(accountId: string | undefined, params?: ListParams) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["cash-ledger", "statement", accountId, params?.page ?? 1, params?.limit ?? 20],
        queryFn: (): Promise<PagedResult<CashLedgerLeg & { running_minor: number; running: number }>> => {
            if (!accountId) return Promise.resolve({ data: [], pagination: { page: 1, limit: 0, total: 0, total_pages: 1 } })
            return cashLedgerService.getStatement(accountId, params)
        },
        enabled: !!accountId,
    })

    return {
        entries: data?.data ?? [],
        pagination: data?.pagination,
        isLoading,
        error,
        refetch,
    }
}

export function usePostDeposit() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: PostDepositInput) =>
            cashLedgerService.postDeposit({ ...data, idempotencyKey: data.idempotencyKey || uuidv4() }),
        onSuccess: (legs) => {
            queryClient.invalidateQueries({ queryKey: ["cash-ledger"] })
            queryClient.invalidateQueries({ queryKey: ["shop", "money-position"] })
            queryClient.invalidateQueries({ queryKey: ["shift-cash-movements"] })
            queryClient.invalidateQueries({ queryKey: ["current-shift"] })
            queryClient.invalidateQueries({ queryKey: ["expected-financials"] })
            queryClient.invalidateQueries({ queryKey: ["expenses"] })
            const amountMinor = legs
                .filter((leg) => leg.amount_minor < 0)
                .reduce((total, leg) => total + Math.abs(leg.amount_minor), 0)
            const amount = amountMinor / 100
            toast.success(`Move recorded: KES ${amount.toLocaleString()}`)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to record deposit")
        },
    })
}
