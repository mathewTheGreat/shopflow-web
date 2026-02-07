import { apiClient } from "@/lib/api-client"
import { User, Role } from "@/types/user"

export const userService = {
    getUserByClerkId: (clerkId: string) =>
        apiClient.get<User>(`/api/users/clerk/${clerkId}`),

    getShopStaffByUser: (userId: string) =>
        apiClient.get<any>(`/api/shop-staff/user/${userId}`),

    getRoles: () => apiClient.get<Role[]>("/api/roles"),

    getShopStaff: (shopId: string) =>
        apiClient.get<any[]>(`/api/shop-staff/shop/${shopId}`),

    getUsersByRole: (roleId: string, shopId?: string) => {
        const query = shopId ? `?shopId=${shopId}` : ""
        return apiClient.get<User[]>(`/api/shop-staff/role/${roleId}${query}`)
    },
}

