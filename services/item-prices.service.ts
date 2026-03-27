import { apiClient } from "@/lib/api-client"
import { ItemPrice } from "@/types/pricing"

export interface CreateItemPriceInput {
    item_id: string
    shop_id: string
    label: string
    price: number
    is_default?: boolean
    is_active?: boolean
    min_quantity?: number
    max_quantity?: number | null
    created_by: string
}

export interface UpdateItemPriceInput {
    label?: string
    price?: number
    is_default?: boolean
    is_active?: boolean
    min_quantity?: number
    max_quantity?: number | null
}

export const itemPricesService = {
    getAll: (shopId?: string) => {
        const params = shopId ? `?shopId=${shopId}` : ""
        return apiClient.get<ItemPrice[]>(`/api/item-prices${params}`)
    },

    getById: (id: string) => {
        return apiClient.get<ItemPrice>(`/api/item-prices/${id}`)
    },

    getByItem: (itemId: string, shopId: string) => {
        return apiClient.get<ItemPrice[]>(`/api/item-prices/item/${itemId}/shop/${shopId}`)
    },

    getDefaultPrice: (itemId: string, shopId: string) => {
        return apiClient.get<ItemPrice>(`/api/item-prices/item/${itemId}/shop/${shopId}/default`)
    },

    getPriceForSale: (itemId: string, shopId: string, selectedPriceId?: string, quantity?: number) => {
        const params = new URLSearchParams()
        if (selectedPriceId) params.append('selectedPriceId', selectedPriceId)
        if (quantity !== undefined) params.append('quantity', quantity.toString())
        const queryString = params.toString()
        return apiClient.get<ItemPrice>(`/api/item-prices/item/${itemId}/shop/${shopId}/price${queryString ? '?' + queryString : ''}`)
    },

    validatePriceSelection: (itemId: string, shopId: string, selectedPriceId: string) => {
        return apiClient.get<ItemPrice>(
            `/api/item-prices/item/${itemId}/shop/${shopId}/validate/${selectedPriceId}`
        )
    },

    create: (data: CreateItemPriceInput) => {
        return apiClient.post<ItemPrice>("/api/item-prices", data)
    },

    update: (id: string, data: UpdateItemPriceInput) => {
        return apiClient.patch<ItemPrice>(`/api/item-prices/${id}`, data)
    },

    deactivate: (id: string) => {
        return apiClient.delete<ItemPrice>(`/api/item-prices/${id}`)
    },

    migrate: (data: {
        itemId: string
        shopId: string
        salePrice: number
        createdBy: string
    }) => {
        return apiClient.post<ItemPrice>("/api/item-prices/migrate", data)
    },
}
