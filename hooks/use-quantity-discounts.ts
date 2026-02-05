import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { quantityDiscountService, CreateQuantityDiscountInput } from "@/services/quantity-discount.service"
import { QuantityDiscount } from "@/types/pricing"

/**
 * Fetch quantity discounts for a specific item
 */
export function useQuantityDiscounts(itemId: string, shopId?: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["quantity-discounts", itemId, shopId],
        queryFn: () => quantityDiscountService.getByItem(itemId, shopId),
        enabled: !!itemId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    return {
        discounts: data || [],
        isLoading,
        error,
        refetch,
    }
}

/**
 * Fetch all quantity discounts for a shop
 */
export function useAllQuantityDiscounts(shopId?: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["quantity-discounts", "all", shopId],
        queryFn: () => quantityDiscountService.getAll(shopId),
        staleTime: 5 * 60 * 1000,
    })

    return {
        discounts: data || [],
        isLoading,
        error,
        refetch,
    }
}

/**
 * Create new quantity discount
 */
export function useCreateQuantityDiscount() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateQuantityDiscountInput) => quantityDiscountService.create(data),
        onSuccess: (_, variables) => {
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: ["quantity-discounts", variables.item_id] })
            queryClient.invalidateQueries({ queryKey: ["quantity-discounts", "all"] })
        },
    })
}

/**
 * Update existing quantity discount
 */
export function useUpdateQuantityDiscount() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<QuantityDiscount> }) =>
            quantityDiscountService.update(id, data),
        onSuccess: (data) => {
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: ["quantity-discounts", data.item_id] })
            queryClient.invalidateQueries({ queryKey: ["quantity-discounts", "all"] })
        },
    })
}

/**
 * Delete quantity discount
 */
export function useDeleteQuantityDiscount() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => quantityDiscountService.delete(id),
        onSuccess: () => {
            // Invalidate all discount queries
            queryClient.invalidateQueries({ queryKey: ["quantity-discounts"] })
        },
    })
}
