import { apiClient } from "@/lib/api-client"
import { Expense } from "@/types/expense"
import { buildListQuery, ListParams, PagedResult } from "@/types/list"

interface ExpenseSummaryResponse {
    totalAmount: number
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
}
