import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { stockLevelService } from "@/services/stock-level.service"

export function useStockLevelsByShop(shopId: string) {
    return useQuery({
        queryKey: ["stock-levels", "shop", shopId],
        queryFn: () => stockLevelService.getStockLevelsByShop(shopId),
        enabled: !!shopId,
    })
}

export function useStockLevelByItem(itemId: string, shopId: string) {
    return useQuery({
        queryKey: ["stock-levels", "item", itemId, "shop", shopId],
        queryFn: () => stockLevelService.getStockLevelByItemAndShop(itemId, shopId),
        enabled: !!itemId && !!shopId,
    })
}

export function useStockLevelsByItem(itemId: string) {
    return useQuery({
        queryKey: ["stock-levels", "item", itemId],
        queryFn: () => stockLevelService.getStockLevelsByItem(itemId),
        enabled: !!itemId,
    })
}

export function useUpdateStockLevel() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ itemId, shopId, data }: { itemId: string; shopId: string; data: Partial<any> }) =>
            stockLevelService.updateStockLevel(itemId, shopId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["stock-levels"] })
        },
    })
}

export function useCreateStockLevel() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: stockLevelService.setStockLevel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["stock-levels"] })
        },
    })
}

export function useBulkUpdateStockLevels() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: stockLevelService.bulkUpdateStockLevels,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["stock-levels"] })
        },
    })
}
