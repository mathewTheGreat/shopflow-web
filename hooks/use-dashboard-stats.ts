import { useQuery } from "@tanstack/react-query"
import { useAppStore } from "@/store/use-app-store"
import { saleService } from "@/services/sale.service"
import { expenseService } from "@/services/expense.service"
import { useShift } from "@/hooks/use-shift"
import { format } from "date-fns"

export function useDashboardStats(date: Date = new Date()) {
    const activeShop = useAppStore((state) => state.activeShop)
    const { currentShift } = useShift()

    // Format date as YYYY-MM-DD for the API
    const dateString = format(date, "yyyy-MM-dd")

    // Determine if we should filter by shift
    // If user is Manager, they see shop totals (shiftId undefined)
    // If user is Cashier, they see only their shift totals (shiftId defined)
    const isManager = activeShop?.role === "Manager"
    const shiftId = !isManager && currentShift ? currentShift.id : undefined

    const params = {
        shopId: activeShop?.id || "",
        date: dateString,
        shiftId
    }

    const { data: sales, isLoading: isLoadingSales, error: salesError } = useQuery({
        queryKey: ["sales-summary", params],
        queryFn: () => saleService.getSummary(params.shopId, params.date, params.shiftId),
        enabled: !!params.shopId,
        staleTime: 60 * 1000, // 1 minute
    })

    const { data: expenses, isLoading: isLoadingExpenses, error: expensesError } = useQuery({
        queryKey: ["expenses-summary", params],
        queryFn: () => expenseService.getSummary(params.shopId, params.date, params.shiftId),
        enabled: !!params.shopId,
        staleTime: 60 * 1000, // 1 minute
    })

    return {
        sales: sales?.totalAmount || 0,
        expenses: expenses?.totalAmount || 0,
        isLoading: isLoadingSales || isLoadingExpenses,
        isManager,
        currency: useAppStore((state) => state.userCurrency) || "KES"
    }
}
