import { apiClient } from "@/lib/api-client"
import { Expense } from "@/types/expense"
import { buildListQuery, ListParams, PagedResult } from "@/types/list"

interface ExpenseSummaryResponse {
    totalAmount: number
}

export interface ExpenseReportRow {
    id: string
    shop_id: string
    shift_id: string
    expense_date: string
    amount: number
    description: string | null
    category: string
    notes: string | null
    payment_method: string | null
    created_by: string | null
    created_at: string | null
    cashierName: string | null
    cashierEmail: string | null
    shiftName: string | null
}

export const expenseService = {
    getSummary: (shopId: string, date: string, shiftId?: string) => {
        const params = new URLSearchParams({
            shopId,
            date,
        })
        if (shiftId) {
            params.append("shiftId", shiftId)
        }
        return apiClient.get<ExpenseSummaryResponse>(`/api/expenses/summary?${params.toString()}`)
    },

    createExpense: (data: Partial<Expense>) => {
        return apiClient.post<Expense>("/api/expenses/v2", data)
    },

    reverseExpense: (expenseId: string, reason: string) =>
        apiClient.post<any>(`/api/expenses/${expenseId}/reverse`, { reason }),

    getExpensesByShop: (shopId: string, params?: ListParams) => {
        return apiClient.get<PagedResult<Expense>>(`/api/expenses/shop/${shopId}${buildListQuery(params)}`)
    },

    getExpenseReport: (params: {
        shopId: string
        startDate: string
        endDate: string
        cashierId?: string
        shiftId?: string
        category?: string
        paymentMethod?: string
    }) => {
        const query = new URLSearchParams({
            shopId: params.shopId,
            startDate: params.startDate,
            endDate: params.endDate,
        })
        if (params.cashierId) query.set("cashierId", params.cashierId)
        if (params.shiftId) query.set("shiftId", params.shiftId)
        if (params.category) query.set("category", params.category)
        if (params.paymentMethod) query.set("paymentMethod", params.paymentMethod)
        return apiClient.get<ExpenseReportRow[]>(`/api/expenses/report?${query.toString()}`)
    },
}
