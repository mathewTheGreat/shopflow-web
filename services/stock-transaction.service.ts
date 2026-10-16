import { apiClient } from "@/lib/api-client"
import { StockTransaction } from "@/types/inventory"
import { buildListQuery, ListParams, PagedResult } from "@/types/list"

export const stockTransactionService = {
    getRecentTransactions: (limit: number = 50) =>
        apiClient.get<StockTransaction[]>(`/api/stock/transactions?limit=${limit}`),

    getTransactionsByShop: (shopId: string, params?: ListParams) =>
        apiClient.get<PagedResult<StockTransaction & { item_name?: string | null; created_by_name?: string | null }>>(`/api/stock/transactions/shop/${shopId}${buildListQuery(params)}`),

    getTransactionsByItem: (itemId: string) =>
        apiClient.get<StockTransaction[]>(`/api/stock/transactions/item/${itemId}`),

    getTransactionById: (id: string) =>
        apiClient.get<StockTransaction>(`/api/stock/transactions/${id}`),

    createTransaction: (data: Partial<StockTransaction>) => {
        return apiClient.post<StockTransaction>("/api/stock/transactions/v2", data);
    },

    createBulkTransactions: (data: Partial<StockTransaction>[]) => {
        return apiClient.post<StockTransaction[]>("/api/stock/transactions/bulk", data);
    },

    reverseTransaction: (id: string, reason: string) =>
        apiClient.post<StockTransaction>(`/api/stock/transactions/${id}/reverse`, { reason }),
}
