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

    getPurchaseCorrectionContext: (id: string, correctedItemId?: string) =>
        apiClient.get<{
            transaction: StockTransaction & { item_name: string; supplier_name: string | null }
            shift: { id: string; start_time: string; end_time: string | null; closing_status: string }
            stockTakes: Array<{ id: string; item_id: string; expected_qty: number; counted_qty: number; variance: number }>
            relatedAdjustments: Array<{ id: string; item_id: string; quantity: number }>
            currentCorrection: {
                id: string
                corrected_item_id: string
                corrected_quantity: number
                reason: string
                related_adjustment_transaction_ids: string[]
            } | null
        }>(`/api/stock/transactions/${id}/correction-context${correctedItemId ? `?correctedItemId=${encodeURIComponent(correctedItemId)}` : ""}`),

    correctPurchaseForReport: (
        id: string,
        data: {
            correctedItemId: string
            quantity: number
            reason: string
            relatedAdjustmentTransactionIds: string[]
        }
    ) => apiClient.post(`/api/stock/transactions/${id}/correct-for-report`, data),
}
