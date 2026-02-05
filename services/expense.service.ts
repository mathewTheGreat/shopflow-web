import { apiClient } from "@/lib/api-client"
import { Expense } from "@/types/expense"

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
        return apiClient.post<Expense>("/api/expenses", data)
    },

    getExpensesByShop: (shopId: string, limit = 50) => {
        const params = new URLSearchParams({
            limit: limit.toString()
        })
        return apiClient.get<Expense[]>(`/api/expenses/shop/${shopId}?${params.toString()}`)
    },
}
