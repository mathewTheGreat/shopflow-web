import { apiClient } from "@/lib/api-client"
import { Customer } from "@/types/customer"
import { buildListQuery, ListParams, PagedResult } from "@/types/list"

export const customerService = {
    getAll: () => {
        return apiClient.get<Customer[]>("/api/customers")
    },

    getById: (id: string) => {
        return apiClient.get<Customer>(`/api/customers/${id}`)
    },

    getBalance: (customerId: string) => {
        return apiClient.get<{ balance: number }>(`/api/customer-payments/balance/customer/${customerId}`)
    },

    create: (data: Partial<Customer>) => {
        return apiClient.post<Customer>("/api/customers", data)
    },

    update: (id: string, data: Partial<Customer>) => {
        return apiClient.patch<Customer>(`/api/customers/${id}`, data)
    },

    getByShop: (shopId: string, params?: ListParams) => {
        return apiClient.get<PagedResult<Customer>>(`/api/customers/shop/${shopId}${buildListQuery(params)}`)
    },

    delete: (id: string) => {
        return apiClient.delete(`/api/customers/${id}`)
    },
}
