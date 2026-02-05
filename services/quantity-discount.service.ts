import { apiClient } from "@/lib/api-client"
import { QuantityDiscount } from "@/types/pricing"

export interface CreateQuantityDiscountInput {
    item_id: string
    shop_id: string
    min_quantity: number
    discount_percent?: number | null
    discount_amount?: number | null
    is_active: boolean
    created_by: string
}

export interface DiscountCalculationResponse {
    finalPrice: number
    discountApplied: number
    discountAmount: number
    discountRule?: QuantityDiscount
    discountPercentage?: number
    discountPerUnit?: number
}

export const quantityDiscountService = {
    /**
     * Get all discount rules, optionally filtered by shop
     */
    getAll: (shopId?: string) => {
        const params = shopId ? `?shopId=${shopId}` : ""
        return apiClient.get<QuantityDiscount[]>(`/api/quantity-discounts${params}`)
    },

    /**
     * Get discount rule by ID
     */
    getById: (id: string) => {
        return apiClient.get<QuantityDiscount>(`/api/quantity-discounts/${id}`)
    },

    /**
     * Get discount rules for a specific item
     */
    getByItem: (itemId: string, shopId?: string) => {
        const params = shopId ? `?shopId=${shopId}` : ""
        return apiClient.get<QuantityDiscount[]>(`/api/quantity-discounts/item/${itemId}${params}`)
    },

    /**
     * Calculate discounted price for an item
     */
    calculate: (itemId: string, shopId: string, quantity: number, basePrice: number) => {
        return apiClient.get<DiscountCalculationResponse>(
            `/api/quantity-discounts/calculate?itemId=${itemId}&shopId=${shopId}&quantity=${quantity}&basePrice=${basePrice}`
        )
    },

    /**
     * Create new discount rule
     */
    create: (data: CreateQuantityDiscountInput) => {
        return apiClient.post<QuantityDiscount>("/api/quantity-discounts", data)
    },

    /**
     * Update existing discount rule
     */
    update: (id: string, data: Partial<QuantityDiscount>) => {
        return apiClient.patch<QuantityDiscount>(`/api/quantity-discounts/${id}`, data)
    },

    /**
     * Delete discount rule
     */
    delete: (id: string) => {
        return apiClient.delete(`/api/quantity-discounts/${id}`)
    },
}
