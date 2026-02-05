import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { stockTakeService } from "@/services/stock-take.service"
import { toast } from "sonner"
import { StockTake } from "@/types/inventory"

export function useStockTakesByShop(shopId: string) {
    return useQuery({
        queryKey: ["stock-takes", "shop", shopId],
        queryFn: () => stockTakeService.getStockTakesByShop(shopId),
        enabled: !!shopId,
    })
}

export function useCreateBulkStockTakes() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: stockTakeService.createBulkStockTakes,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["stock-takes"] })
            queryClient.invalidateQueries({ queryKey: ["stock-levels"] })
            queryClient.invalidateQueries({ queryKey: ["stock-transactions"] })
        },
    })
}

export function useMarkAsAdjusted() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: stockTakeService.markAsAdjusted,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["stock-takes"] })
        },
    })
}
