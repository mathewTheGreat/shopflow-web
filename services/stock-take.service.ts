import { apiClient } from "@/lib/api-client"
import { StockTake } from "@/types/inventory"
import { VarianceReportData, VarianceSummaryReport } from "@/types/stock-report"

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

    getVarianceSummaryReport: (params: { shopId: string; startDate: string; endDate: string; cashierId?: string }) => {
        const queryParams = new URLSearchParams({
            shopId: params.shopId,
            startDate: params.startDate,
            endDate: params.endDate
        });
        if (params.cashierId) {
            queryParams.append("cashierId", params.cashierId);
        }
        return apiClient.get<VarianceSummaryReport>(`/api/stock/takes/variance-summary-report?${queryParams.toString()}`);
    },
}
