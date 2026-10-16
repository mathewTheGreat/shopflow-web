import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { expenseService } from "@/services/expense.service"
import { Expense } from "@/types/expense"
import { ListParams, PagedResult } from "@/types/list"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"

export function useExpenses(shopId: string | undefined, params?: ListParams) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["expenses", shopId, params?.search ?? "", params?.page ?? 1, params?.limit ?? 50],
        queryFn: (): Promise<PagedResult<Expense>> => {
            if (!shopId) return Promise.resolve({ data: [], pagination: { page: 1, limit: 0, total: 0, total_pages: 1 } })
            return expenseService.getExpensesByShop(shopId, params)
        },
        enabled: !!shopId,
    })

    return {
        expenses: data?.data ?? [],
        pagination: data?.pagination,
        isLoading,
        error,
        refetch,
    }
}

export function useCreateExpense() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: Omit<Expense, 'id' | '_version' | '_last_modified_at' | '_is_pending'>) => {
            const expenseId = uuidv4()
            const now = new Date().toISOString()

            const payload: Partial<Expense> = {
                ...data,
                id: expenseId,
                created_at: now,
                _version: 1,
                _last_modified_at: now,
                _is_pending: false,
            }

            const expense = await expenseService.createExpense(payload)
            return expense
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] })
            queryClient.invalidateQueries({ queryKey: ["expenses-summary"] })
            queryClient.invalidateQueries({ queryKey: ["shift-cash-movements"] })
            toast.success("Expense recorded successfully")
        },
        onError: (error: Error) => {
            toast.error(`Failed to record expense: ${error.message}`)
        },
    })
}
