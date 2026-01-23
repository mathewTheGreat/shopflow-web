import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { CreateStoreInput } from "@/lib/validators/store"

export function useCreateStore() {
    return useMutation({
        mutationFn: async (data: CreateStoreInput) => {
            return apiClient.post("/api/stores", data)
        },
    })
}
