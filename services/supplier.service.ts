import { apiClient } from "@/lib/api-client"
import { Supplier } from "@/types/supplier"
import { buildListQuery, ListParams, PagedResult } from "@/types/list"

export const supplierService = {
    getSuppliers: (params?: ListParams) => apiClient.get<PagedResult<Supplier>>(`/api/suppliers${buildListQuery(params)}`),
    getSupplier: (id: string) => apiClient.get<Supplier>(`/api/suppliers/${id}`),
    createSupplier: (data: Partial<Supplier>) => apiClient.post<Supplier>("/api/suppliers", data),
    updateSupplier: (id: string, data: Partial<Supplier>) => apiClient.put<Supplier>(`/api/suppliers/${id}`, data),
    deleteSupplier: (id: string) => apiClient.delete(`/api/suppliers/${id}`),

    // Reports
    getSupplierDeliveries: (supplierId: string | undefined, startDate: string, endDate: string, itemId?: string) => {
        const queryParams = new URLSearchParams({
            startDate,
            endDate,
            supplierId: supplierId || "",
            item: itemId || ""
        })
        return apiClient.get<any[]>(`/api/suppliers/deliveries?${queryParams.toString()}`)
    }
}
