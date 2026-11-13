import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { stockTakeService } from "@/services/stock-take.service"
import { toast } from "sonner"
import { StockTake } from "@/types/inventory"

type StockTakeSubmission = Pick<StockTake, "id" | "item_id" | "shop_id" | "shift_id" | "counted_qty"> & {
    notes?: string | null
}

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
        mutationFn: ({ takes, autoAdjust }: { takes: StockTakeSubmission[]; autoAdjust?: boolean }) =>
            stockTakeService.createBulkStockTakes(takes, autoAdjust),
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
