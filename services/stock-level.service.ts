import { apiClient } from "@/lib/api-client"
import { StockLevel } from "@/types/inventory"

export const stockLevelService = {
    getStockLevelByItemAndShop: (itemId: string, shopId: string) =>
        apiClient.get<StockLevel>(`/api/stock/levels/${itemId}/shop/${shopId}`),

    getStockLevelsByShop: (shopId: string) =>
        apiClient.get<StockLevel[]>(`/api/stock/levels/shop/${shopId}`),

    getStockLevelsByItem: (itemId: string) =>
        apiClient.get<StockLevel[]>(`/api/stock/levels/item/${itemId}`),

    setStockLevel: (data: Partial<StockLevel>) =>
        apiClient.post<StockLevel>("/api/stock/levels", data),

    updateStockLevel: (itemId: string, shopId: string, data: Partial<StockLevel>) =>
        apiClient.patch<StockLevel>(`/api/stock/levels/${itemId}/shop/${shopId}`, data),

    bulkUpdateStockLevels: (data: Partial<StockLevel>[]) =>
        apiClient.post<StockLevel[]>("/api/stock/levels/bulk", data),
}
