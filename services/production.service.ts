import { apiClient } from "@/lib/api-client"
import { ProductionBatch, OpenBatchRequest, CloseBatchRequest, ProductionBatchesQueryParams, ProductionBatchesResponse } from "@/types/production"

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

    cancelBatch: (id: string) => {
        return apiClient.post<ProductionBatch>(`/api/production/${id}/cancel`, {})
    },
}
