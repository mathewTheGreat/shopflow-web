import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { expenseService } from "@/services/expense.service"
import { shiftService } from "@/services/shift.service"
import { Expense } from "@/types/expense"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"

export function useExpenses(shopId: string | undefined, limit = 50) {
    return useQuery({
        queryKey: ["expenses", shopId, limit],
        queryFn: () => {
            if (!shopId) return []
            return expenseService.getExpensesByShop(shopId, limit)
        },
        enabled: !!shopId,
    })
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

            // 1. Create Expense
            const expense = await expenseService.createExpense(payload)

            // 2. Record Cash Movement for Shift Reconciliation
            const payoutReason = `Expense: ${data.description || data.category}`
            await shiftService.recordCashMovement({
                id: uuidv4(),
                shift_id: data.shift_id,
                type: 'PAY_OUT',
                amount: data.amount,
                payment_method: data.payment_method,
                reason: payoutReason,
                created_by: data.created_by,
                _version: 1,
                _last_modified_at: now,
                _is_pending: false,
            })

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
