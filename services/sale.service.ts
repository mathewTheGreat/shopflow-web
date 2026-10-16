import { apiClient } from "@/lib/api-client"
import { buildListQuery, ListParams, PagedResult } from "@/types/list"

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
        return apiClient.post("/api/sales/complete-v2", data)
    },

    getSales: (shopId: string, params?: ListParams) => {
        return apiClient.get<PagedResult<any>>(`/api/sales/shop/${shopId}${buildListQuery(params)}`)
    },

    getSaleReceipt: (saleId: string) => {
        return apiClient.get<any>(`/api/sales/${saleId}/receipt`)
    },

    reverseSale: (saleId: string, reason: string) =>
        apiClient.post<any>(`/api/sales/${saleId}/reverse`, { reason }),

    getSalesReport: (params: {
        shopId: string;
        startDate?: string;
        endDate?: string;
        cashierId?: string;
        customerId?: string;
        saleCategory?: string;
        itemId?: string;
        shiftId?: string;
    }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('shopId', params.shopId);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.cashierId && params.cashierId !== 'all') queryParams.append('cashierId', params.cashierId);
        if (params.customerId && params.customerId !== 'all') queryParams.append('customerId', params.customerId);
        if (params.saleCategory && params.saleCategory !== 'all') queryParams.append('saleCategory', params.saleCategory);
        if (params.itemId && params.itemId !== 'all') queryParams.append('item', params.itemId);
        if (params.shiftId) queryParams.append('shiftId', params.shiftId);

        return apiClient.get<any[]>(`/api/sales/report?${queryParams.toString()}`);
    },
}

