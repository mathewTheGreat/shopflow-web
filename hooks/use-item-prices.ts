import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { itemPricesService, CreateItemPriceInput, UpdateItemPriceInput } from "@/services/item-prices.service"
import { ItemPrice } from "@/types/pricing"

export function useItemPrices(itemId: string, shopId: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["item-prices", itemId, shopId],
        queryFn: () => itemPricesService.getByItem(itemId, shopId),
        enabled: !!itemId && !!shopId,
        staleTime: 5 * 60 * 1000,
    })

    return {
        prices: data || [],
        isLoading,
        error,
        refetch,
    }
}

export function useAllItemPrices(shopId?: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["item-prices", "all", shopId],
        queryFn: () => itemPricesService.getAll(shopId),
        staleTime: 5 * 60 * 1000,
    })

    return {
        prices: data || [],
        isLoading,
        error,
        refetch,
    }
}

export function useDefaultItemPrice(itemId: string, shopId: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["item-prices", itemId, shopId, "default"],
        queryFn: () => itemPricesService.getDefaultPrice(itemId, shopId),
        enabled: !!itemId && !!shopId,
        staleTime: 5 * 60 * 1000,
    })

    return {
        defaultPrice: data,
        isLoading,
        error,
        refetch,
    }
}

export function usePriceForSale(itemId: string, shopId: string, selectedPriceId?: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["item-prices", "sale", itemId, shopId, selectedPriceId],
        queryFn: () => itemPricesService.getPriceForSale(itemId, shopId, selectedPriceId),
        enabled: !!itemId && !!shopId,
        staleTime: 5 * 60 * 1000,
    })

    return {
        price: data,
        isLoading,
        error,
        refetch,
    }
}

export function useCreateItemPrice() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateItemPriceInput) => itemPricesService.create(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["item-prices", variables.item_id] })
            queryClient.invalidateQueries({ queryKey: ["item-prices", "all"] })
        },
    })
}

export function useUpdateItemPrice() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateItemPriceInput }) =>
            itemPricesService.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["item-prices", data.item_id] })
            queryClient.invalidateQueries({ queryKey: ["item-prices", "all"] })
        },
    })
}

export function useDeactivateItemPrice() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => itemPricesService.deactivate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["item-prices"] })
        },
    })
}

export function useMigrateItemPrices() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { itemId: string; shopId: string; salePrice: number; createdBy: string }) =>
            itemPricesService.migrate(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["item-prices", variables.itemId] })
            queryClient.invalidateQueries({ queryKey: ["item-prices", "all"] })
        },
    })
}
