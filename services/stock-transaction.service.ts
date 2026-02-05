import { apiClient } from "@/lib/api-client"
import { StockTransaction } from "@/types/inventory"

export const stockTransactionService = {
    getRecentTransactions: (limit: number = 50) =>
        apiClient.get<StockTransaction[]>(`/api/stock/transactions?limit=${limit}`),

    getTransactionsByShop: (shopId: string, limit?: number) =>
        apiClient.get<StockTransaction[]>(`/api/stock/transactions/shop/${shopId}${limit ? `?limit=${limit}` : ""}`),

    getTransactionsByItem: (itemId: string) =>
        apiClient.get<StockTransaction[]>(`/api/stock/transactions/item/${itemId}`),

    getTransactionById: (id: string) =>
        apiClient.get<StockTransaction>(`/api/stock/transactions/${id}`),

    createTransaction: (data: Partial<StockTransaction>) =>
        apiClient.post<StockTransaction>("/api/stock/transactions", data),

    createBulkTransactions: (data: Partial<StockTransaction>[]) =>
        apiClient.post<StockTransaction[]>("/api/stock/transactions/bulk", data),
}
