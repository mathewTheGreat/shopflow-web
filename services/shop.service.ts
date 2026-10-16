import { apiClient } from "@/lib/api-client"
import { CreateShopInput, Shop } from "@/types/shop"

export interface ShopMoneyPosition {
    shopId: string
    cash: number
    mpesa: number
    byMethod: Record<string, number>
}

export const shopService = {
    createShop: (data: CreateShopInput & { userId?: string }) =>
        apiClient.post<Shop>("/api/shops", data),
    getShops: () => apiClient.get<Shop[]>("/api/shops"),
    getShop: (id: string) => apiClient.get<Shop>(`/api/shops/${id}`),
    getMoneyPosition: (shopId: string) =>
        apiClient.get<ShopMoneyPosition>(`/api/shops/${shopId}/money-position`),
}
