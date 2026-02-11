import { apiClient } from "@/lib/api-client"

export const syncService = {
    sync: (data: any[]) => apiClient.post<any>("/api/sync", { changes: data }),
}
