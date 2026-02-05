import { apiClient } from "@/lib/api-client"
import { Supplier } from "@/types/supplier"

export const supplierService = {
    getSuppliers: () => apiClient.get<Supplier[]>("/api/suppliers"),
    getSupplier: (id: string) => apiClient.get<Supplier>(`/api/suppliers/${id}`),
    createSupplier: (data: Partial<Supplier>) => apiClient.post<Supplier>("/api/suppliers", data),
    updateSupplier: (id: string, data: Partial<Supplier>) => apiClient.put<Supplier>(`/api/suppliers/${id}`, data),
    deleteSupplier: (id: string) => apiClient.delete(`/api/suppliers/${id}`),
}
