import { apiClient } from "@/lib/api-client"
import { Customer } from "@/types/customer"

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

    getByShop: (shopId: string) => {
        return apiClient.get<Customer[]>(`/api/customers/shop/${shopId}`)
    },

    delete: (id: string) => {
        return apiClient.delete(`/api/customers/${id}`)
    },
}
