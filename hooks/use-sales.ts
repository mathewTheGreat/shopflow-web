import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { saleService } from "@/services/sale.service"
import { ListParams, PagedResult } from "@/types/list"
import { toast } from "sonner"

export function useCreateSale() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: saleService.completeSale,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales"] })
            queryClient.invalidateQueries({ queryKey: ["sales-summary"] })
            queryClient.invalidateQueries({ queryKey: ["items"] }) // Stock might have changed
            queryClient.invalidateQueries({ queryKey: ["customer-balance"] })
            toast.success("Sale completed successfully")
        },
        onError: (error: Error) => {
            toast.error(`Failed to complete sale: ${error.message}`)
        },
    })
}

export function useSales(shopId: string | undefined, params?: ListParams) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["sales", shopId, params?.search ?? "", params?.page ?? 1, params?.limit ?? 50],
        queryFn: (): Promise<PagedResult<any>> => {
            if (!shopId) return Promise.resolve({ data: [], pagination: { page: 1, limit: 0, total: 0, total_pages: 1 } })
            return saleService.getSales(shopId, params)
        },
        enabled: !!shopId,
    })

    return {
        sales: data?.data ?? [],
        pagination: data?.pagination,
        isLoading,
        error,
        refetch,
    }
}

export function useSaleReceipt(saleId: string | null) {
    return useQuery({
        queryKey: ["sale-receipt", saleId],
        queryFn: () => {
            if (!saleId) return null
            return saleService.getSaleReceipt(saleId)
        },
        enabled: !!saleId,
    })
}
