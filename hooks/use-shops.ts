import { useQuery } from "@tanstack/react-query"
import { shopService } from "@/services/shop.service"

export function useShops() {
    return useQuery({
        queryKey: ["shops"],
        queryFn: () => shopService.getShops(),
    })
}
