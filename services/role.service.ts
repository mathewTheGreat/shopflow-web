import { apiClient } from "@/lib/api-client"
import { Role } from "@/types/user"

export const roleService = {
    getRoles: () => apiClient.get<Role[]>("/api/roles"),
    getRole: (id: string) => apiClient.get<Role>(`/api/roles/${id}`),
}
