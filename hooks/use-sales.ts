import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { saleService } from "@/services/sale.service"
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

export function useSales(shopId: string | undefined, limit = 50) {
    return useQuery({
        queryKey: ["sales", shopId, limit],
        queryFn: () => {
            if (!shopId) return []
            return saleService.getSales(shopId, limit)
        },
        enabled: !!shopId,
    })
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
