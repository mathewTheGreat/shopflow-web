import { useQuery } from "@tanstack/react-query"
import { shopService, ShopMoneyPosition } from "@/services/shop.service"

export function useMoneyPosition(shopId: string | undefined) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["shop", "money-position", shopId],
        queryFn: (): Promise<ShopMoneyPosition> => {
            if (!shopId) return Promise.resolve({ shopId: "", cash: 0, mpesa: 0, byMethod: {} })
            return shopService.getMoneyPosition(shopId)
        },
        enabled: !!shopId,
    })

    return {
        position: data ?? { shopId: shopId ?? "", cash: 0, mpesa: 0, byMethod: {} },
        isLoading,
        error,
        refetch,
    }
}
