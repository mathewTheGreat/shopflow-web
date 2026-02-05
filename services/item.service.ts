import { apiClient } from "@/lib/api-client"

export interface Item {
    id: string
    name: string
    description?: string
    item_type: "Sale" | "In-house"
    unit_of_measure: string
    sale_price: number
    cost_price: number
    createdAt: string
    updatedAt: string
}

export const itemService = {
    getAll: () => {
        return apiClient.get<Item[]>("/api/items")
    },

    getById: (itemId: string) => {
        return apiClient.get<Item>(`/api/items/${itemId}`)
    },

    create: (data: Partial<Item>) => {
        return apiClient.post<Item>("/api/items", data)
    },

    update: (itemId: string, data: Partial<Item>) => {
        return apiClient.patch<Item>(`/api/items/${itemId}`, data)
    },
}
