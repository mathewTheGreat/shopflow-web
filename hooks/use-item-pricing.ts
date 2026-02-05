import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { itemPricingService, CreateItemPricingInput } from "@/services/item-pricing.service"
import { ItemPricing } from "@/types/pricing"

/**
 * Fetch pricing rules for a specific item
 */
export function useItemPricing(itemId: string, shopId?: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["item-pricing", itemId, shopId],
        queryFn: () => itemPricingService.getByItem(itemId, shopId),
        enabled: !!itemId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    return {
        pricingRules: data || [],
        isLoading,
        error,
        refetch,
    }
}

/**
 * Fetch all pricing rules for a shop
 */
export function useAllItemPricing(shopId?: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["item-pricing", "all", shopId],
        queryFn: () => itemPricingService.getAll(shopId),
        staleTime: 5 * 60 * 1000,
    })

    return {
        pricingRules: data || [],
        isLoading,
        error,
        refetch,
    }
}

/**
 * Create new pricing rule
 */
export function useCreateItemPricing() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateItemPricingInput) => itemPricingService.create(data),
        onSuccess: (_, variables) => {
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: ["item-pricing", variables.item_id] })
            queryClient.invalidateQueries({ queryKey: ["item-pricing", "all"] })
        },
    })
}

/**
 * Update existing pricing rule
 */
export function useUpdateItemPricing() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ItemPricing> }) =>
            itemPricingService.update(id, data),
        onSuccess: (data) => {
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: ["item-pricing", data.item_id] })
            queryClient.invalidateQueries({ queryKey: ["item-pricing", "all"] })
        },
    })
}

/**
 * Delete pricing rule
 */
export function useDeleteItemPricing() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => itemPricingService.delete(id),
        onSuccess: () => {
            // Invalidate all pricing queries
            queryClient.invalidateQueries({ queryKey: ["item-pricing"] })
        },
    })
}
