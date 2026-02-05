import { useQuery } from "@tanstack/react-query"
import { itemService } from "@/services/item.service"

export function useItems() {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["items"],
        queryFn: () => itemService.getAll(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    return {
        items: data || [],
        isLoading,
        error,
        refetch,
    }
}
