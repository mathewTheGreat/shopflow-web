import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { stockTransactionService } from "@/services/stock-transaction.service"
import { toast } from "sonner"
import { StockTransaction } from "@/types/inventory"

export function useRecentStockTransactions(limit: number = 50) {
    return useQuery({
        queryKey: ["stock-transactions", "recent", limit],
        queryFn: () => stockTransactionService.getRecentTransactions(limit),
    })
}

export function useStockTransactionsByShop(shopId: string, limit?: number) {
    return useQuery({
        queryKey: ["stock-transactions", "shop", shopId, limit],
        queryFn: () => stockTransactionService.getTransactionsByShop(shopId, limit),
        enabled: !!shopId,
    })
}

export function useStockTransactionsByItem(itemId: string) {
    return useQuery({
        queryKey: ["stock-transactions", "item", itemId],
        queryFn: () => stockTransactionService.getTransactionsByItem(itemId),
        enabled: !!itemId,
    })
}

export function useCreateStockTransaction() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: stockTransactionService.createTransaction,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["stock-transactions"] })
            await queryClient.invalidateQueries({ queryKey: ["stock-levels"] })
            toast.success("Stock transaction recorded successfully")
        },
        onError: (error: Error) => {
            toast.error(`Failed to record stock transaction: ${error.message}`)
        },
    })
}

export function useCreateBulkTransactions() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: stockTransactionService.createBulkTransactions,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["stock-transactions"] })
        },
    })
}
