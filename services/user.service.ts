import { apiClient } from "@/lib/api-client"
import { User, Role } from "@/types/user"

export const userService = {
    getUserByClerkId: (clerkId: string) =>
        apiClient.get<User>(`/api/users/clerk/${clerkId}`),

    getShopStaffByUser: (userId: string) =>
        apiClient.get<any>(`/api/shop-staff/user/${userId}`),

    getRoles: () => apiClient.get<Role[]>("/api/roles"),
}
