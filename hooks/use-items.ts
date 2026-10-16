import { useQuery } from "@tanstack/react-query"
import { itemService } from "@/services/item.service"
import { ListParams } from "@/types/list"

export function useItems(params?: ListParams) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["items", params?.search ?? "", params?.page ?? 0, params?.limit ?? 0],
        queryFn: () => itemService.getAll(params),
    })

    return {
        items: data?.data ?? [],
        pagination: data?.pagination,
        isLoading,
        error,
        refetch,
    }
}
