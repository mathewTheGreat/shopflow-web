import { apiClient } from "@/lib/api-client"
import { ProductionBatch, OpenBatchRequest, CloseBatchRequest, CancelBatchRequest, ProductionBatchesQueryParams, ProductionBatchesResponse, ProductionReportParams, ProductionReportData } from "@/types/production"

export const productionService = {
    openBatch: (data: OpenBatchRequest) => {
        return apiClient.post<ProductionBatch>("/api/production/open", data)
    },

    closeBatch: (id: string, data: CloseBatchRequest) => {
        return apiClient.post<ProductionBatch>(`/api/production/${id}/close`, data)
    },

    getBatch: (id: string) => {
        return apiClient.get<ProductionBatch>(`/api/production/${id}`)
    },

    getShopBatches: (shopId: string, params: ProductionBatchesQueryParams = {}) => {
        const queryParams = new URLSearchParams()
        
        if (params.page) queryParams.set("page", params.page.toString())
        if (params.limit) queryParams.set("limit", params.limit.toString())
        if (params.status) queryParams.set("status", params.status)
        if (params.process_type) queryParams.set("process_type", params.process_type)
        if (params.sort_by) queryParams.set("sort_by", params.sort_by)
        if (params.sort_order) queryParams.set("sort_order", params.sort_order)
        if (params.search) queryParams.set("search", params.search)

        const queryString = queryParams.toString()
        return apiClient.get<ProductionBatchesResponse>(`/api/production/shop/${shopId}${queryString ? `?${queryString}` : ""}`)
    },

    cancelBatch: (id: string, data: CancelBatchRequest) => {
        return apiClient.post<ProductionBatch>(`/api/production/${id}/cancel`, data)
    },

    getProductionReport: (shopId: string, params: ProductionReportParams = {}) => {
        const queryParams = new URLSearchParams()
        
        if (params.date) queryParams.set("date", params.date)
        if (params.start_date) queryParams.set("start_date", params.start_date)
        if (params.end_date) queryParams.set("end_date", params.end_date)
        if (params.status) queryParams.set("status", params.status)
        if (params.process_type) queryParams.set("process_type", params.process_type)

        const queryString = queryParams.toString()
        return apiClient.get<ProductionReportData>(`/api/production/shop/${shopId}/report${queryString ? `?${queryString}` : ""}`)
    },
}
