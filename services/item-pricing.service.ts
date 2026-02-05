import { apiClient } from "@/lib/api-client"
import { ItemPricing } from "@/types/pricing"

export interface CreateItemPricingInput {
    item_id: string
    shop_id: string
    override_price: number
    min_quantity?: number | null
    max_quantity?: number | null
    is_active: boolean
    created_by: string
}

export interface ItemPriceResponse {
    basePrice: number
    overrideApplied: boolean
    pricingRule?: ItemPricing
    itemDetails?: any
}

export const itemPricingService = {
    /**
     * Get all pricing rules, optionally filtered by shop
     */
    getAll: (shopId?: string) => {
        const params = shopId ? `?shopId=${shopId}` : ""
        return apiClient.get<ItemPricing[]>(`/api/item-pricing${params}`)
    },

    /**
     * Get pricing rule by ID
     */
    getById: (id: string) => {
        return apiClient.get<ItemPricing>(`/api/item-pricing/${id}`)
    },

    /**
     * Get pricing rules for a specific item
     */
    getByItem: (itemId: string, shopId?: string) => {
        const params = shopId ? `?shopId=${shopId}` : ""
        return apiClient.get<ItemPricing[]>(`/api/item-pricing/item/${itemId}${params}`)
    },

    /**
     * Get calculated price for an item at a specific shop and quantity
     */
    getItemPrice: (itemId: string, shopId: string, quantity: number = 1) => {
        return apiClient.get<ItemPriceResponse>(
            `/api/item-pricing/item/${itemId}/shop/${shopId}/price?quantity=${quantity}`
        )
    },

    /**
     * Create new pricing rule
     */
    create: (data: CreateItemPricingInput) => {
        return apiClient.post<ItemPricing>("/api/item-pricing", data)
    },

    /**
     * Update existing pricing rule
     */
    update: (id: string, data: Partial<ItemPricing>) => {
        return apiClient.patch<ItemPricing>(`/api/item-pricing/${id}`, data)
    },

    /**
     * Delete pricing rule
     */
    delete: (id: string) => {
        return apiClient.delete(`/api/item-pricing/${id}`)
    },
}
