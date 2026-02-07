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

    getSalesReport: (params: {
        shopId: string;
        startDate?: string;
        endDate?: string;
        cashierId?: string;
        customerId?: string;
        saleCategory?: string;
    }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('shopId', params.shopId);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.cashierId && params.cashierId !== 'all') queryParams.append('cashierId', params.cashierId);
        if (params.customerId && params.customerId !== 'all') queryParams.append('customerId', params.customerId);
        if (params.saleCategory && params.saleCategory !== 'all') queryParams.append('saleCategory', params.saleCategory);

        return apiClient.get<any[]>(`/api/sales/report?${queryParams.toString()}`);
    },
}

