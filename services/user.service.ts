import { apiClient } from "@/lib/api-client"
import { User, Role } from "@/types/user"

export const userService = {
    getUserByClerkId: (clerkId: string) =>
        apiClient.get<User>(`/api/users/clerk/${clerkId}`),

    getShopStaffByUser: (userId: string) =>
        apiClient.get<any>(`/api/shop-staff/user/${userId}`),

    getRoles: () => apiClient.get<Role[]>("/api/roles"),

    getShopStaff: (shopId: string) =>
        apiClient.get<Array<{ id: string; user_id: string; shop_id: string; role_id: string }>>(`/api/shop-staff/shop/${shopId}`),

    getUsersByRole: (roleId: string, shopId?: string) => {
        const query = shopId ? `?shopId=${shopId}` : ""
        return apiClient.get<User[]>(`/api/shop-staff/role/${roleId}${query}`)
    },

    getReportCashiers: (shopId: string, startDate: string, endDate: string) => {
        const query = new URLSearchParams({ startDate, endDate })
        return apiClient.get<User[]>(`/api/shop-staff/report-cashiers/${shopId}?${query.toString()}`)
    },

    transferCashier: (staffId: string, destinationShopId: string) =>
        apiClient.post<{
            userId: string
            destinationShopId: string
            destinationAssignmentId: string
            transferGroupId: string
            auditedAssignments: number
        }>("/api/shop-staff/transfer", { staffId, destinationShopId }),
}
