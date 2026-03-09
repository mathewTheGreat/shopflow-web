import { useQuery } from "@tanstack/react-query"
import { itemService } from "@/services/item.service"

export function useItems() {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["items"],
        queryFn: () => itemService.getAll(),
    })

    return {
        items: data || [],
        isLoading,
        error,
        refetch,
    }
}
