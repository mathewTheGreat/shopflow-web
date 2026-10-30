import { apiClient } from "@/lib/api-client"
import { buildListQuery, ListParams, PagedResult } from "@/types/list"

export type RegisterAccountType = 'DRAWER' | 'SAFE' | 'BANK' | 'MPESA'

export interface CashLedgerLeg {
    id: string
    account_id: string
    amount_minor: number
    type: string
    transfer_group_id: string | null
    notes?: string | null
    created_at?: string | null
    effective_at?: string | null
    recorded_at?: string | null
}

export interface PostDepositInput {
    shopId: string
    amount: number
    fromAccount?: RegisterAccountType
    toAccount?: RegisterAccountType
    reason?: string
    idempotencyKey?: string
}

export interface AccountWithBalance {
    id: string
    account_type: RegisterAccountType
    currency: string
    is_active: boolean
    balanceMinor: number
    balance: number
}

export interface RegisterInitializationStatus {
    initialized: boolean
    initializedAt: string | null
    accounts: AccountWithBalance[]
    activeShiftId: string | null
}

export interface InitializeRegisterInput {
    shopId: string
    balances: Record<RegisterAccountType, number>
    note?: string
    requestId?: string
}

export const cashLedgerService = {
    postDeposit: (data: PostDepositInput) =>
        apiClient.post<CashLedgerLeg[]>("/api/cash-ledger/deposit", data),

    getBalance: (accountId: string) =>
        apiClient.get<{ accountId: string; balanceMinor: number; balance: number; currency: string }>(
            `/api/cash-ledger/balance/${accountId}`
        ),

    getTransferGroup: (transferGroupId: string) =>
        apiClient.get<CashLedgerLeg[]>(`/api/cash-ledger/transfer/${transferGroupId}`),

    listAccounts: (shopId: string) =>
        apiClient.get<AccountWithBalance[]>(`/api/cash-ledger/accounts/shop/${shopId}`),

    getInitialization: (shopId: string) =>
        apiClient.get<RegisterInitializationStatus>(`/api/cash-ledger/initialization/${shopId}`),

    initializeRegister: (data: InitializeRegisterInput) =>
        apiClient.post<RegisterInitializationStatus>("/api/cash-ledger/initialize", data),

    getStatement: (accountId: string, params?: ListParams) =>
        apiClient.get<PagedResult<CashLedgerLeg & { running_minor: number; running: number }>>(
            `/api/cash-ledger/statement/${accountId}${buildListQuery(params)}`
        ),
}
