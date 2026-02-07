import { apiClient } from "@/lib/api-client"
import { StockTake } from "@/types/inventory"
import { VarianceReportData } from "@/types/stock-report"

export const stockTakeService = {
    createStockTake: (data: Partial<StockTake>) =>
        apiClient.post<StockTake>("/api/stock/takes", data),

    createBulkStockTakes: (data: Partial<StockTake>[]) =>
        apiClient.post<StockTake[]>("/api/stock/takes/bulk", data),

    getStockTakesByShop: (shopId: string) =>
        apiClient.get<StockTake[]>(`/api/stock/takes/shop/${shopId}`),

    getStockTakesByShift: (shiftId: string) =>
        apiClient.get<StockTake[]>(`/api/stock/takes/shift/${shiftId}`),

    getVarianceReport: (shiftId: string) =>
        apiClient.get<VarianceReportData>(`/api/stock/takes/variance-report?shiftId=${shiftId}`),

    getUnadjustedStockTakes: () =>
        apiClient.get<StockTake[]>("/api/stock/takes/unadjusted"),

    markAsAdjusted: (id: string) =>
        apiClient.post<StockTake>(`/api/stock/takes/${id}/adjust`, {}),
}
