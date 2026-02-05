import { apiClient } from "@/lib/api-client"

interface SalesSummaryResponse {
    totalAmount: number
}

export const saleService = {
    getSummary: (shopId: string, date: string, shiftId?: string) => {
        const params = new URLSearchParams({
            shopId,
            date,
        })
        if (shiftId) {
            params.append("shiftId", shiftId)
        }
        return apiClient.get<SalesSummaryResponse>(`/api/sales/summary?${params.toString()}`)
    },

    completeSale: (data: any) => {
        return apiClient.post("/api/sales/complete", data)
    },

    getSales: (shopId: string, limit = 50) => {
        const params = new URLSearchParams({
            limit: limit.toString()
        })
        return apiClient.get<any[]>(`/api/sales/shop/${shopId}?${params.toString()}`)
    },

    getSaleReceipt: (saleId: string) => {
        return apiClient.get<any>(`/api/sales/${saleId}/receipt`)
    },
}
