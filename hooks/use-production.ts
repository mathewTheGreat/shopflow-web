import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productionService } from "@/services/production.service"
import { OpenBatchRequest, CloseBatchRequest, CancelBatchRequest, ProductionBatchesQueryParams, ProductionBatchesResponse } from "@/types/production"
import { toast } from "sonner"
import { useAppStore } from "@/store/use-app-store"

export function useProductionBatches(
    shopId: string | undefined, 
    params: ProductionBatchesQueryParams = {}
) {
    return useQuery<ProductionBatchesResponse>({
        queryKey: ["production-batches", shopId, params],
        queryFn: () => {
            if (!shopId) {
                return { data: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } }
            }
            return productionService.getShopBatches(shopId, params)
        },
        enabled: !!shopId,
    })
}

export function useProductionBatch(id: string | undefined) {
    return useQuery({
        queryKey: ["production-batch", id],
        queryFn: () => {
            if (!id) return null
            return productionService.getBatch(id)
        },
        enabled: !!id,
    })
}

export function useOpenProductionBatch() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: OpenBatchRequest) => {
            return productionService.openBatch(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["production-batches"] })
            toast.success("Production batch opened successfully")
        },
        onError: (error: Error) => {
            toast.error(`Failed to open batch: ${error.message}`)
        },
    })
}

export function useCloseProductionBatch() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: CloseBatchRequest }) => {
            return productionService.closeBatch(id, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["production-batches"] })
            queryClient.invalidateQueries({ queryKey: ["production-batch"] })
            toast.success("Production batch closed successfully")
        },
        onError: (error: Error) => {
            toast.error(`Failed to close batch: ${error.message}`)
        },
    })
}

export function useCancelProductionBatch() {
    const queryClient = useQueryClient()
    const userInfo = useAppStore((state) => state.userInfo)

    return useMutation({
        mutationFn: async (id: string) => {
            if (!userInfo?.id) {
                throw new Error("User not authenticated")
            }
            return productionService.cancelBatch(id, { cancelled_by: userInfo.id })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["production-batches"] })
            queryClient.invalidateQueries({ queryKey: ["production-batch"] })
            toast.success("Production batch cancelled successfully")
        },
        onError: (error: Error) => {
            toast.error(`Failed to cancel batch: ${error.message}`)
        },
    })
}
