import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ShopInfo {
    id: string
    name: string
    role?: string
}

interface UserInfo {
    id: string
    name: string
    email: string
}

interface AppState {
    activeShop: ShopInfo | null
    setActiveShop: (shop: ShopInfo | null) => void
    userInfo: UserInfo | null
    setUserInfo: (user: UserInfo | null) => void
    activeShift: any | null
    setActiveShift: (shift: any | null) => void
    userCurrency: string
    setUserCurrency: (currency: string) => void
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            activeShop: null,
            setActiveShop: (shop: ShopInfo | null) => set({ activeShop: shop }),
            userInfo: null,
            setUserInfo: (user: UserInfo | null) => set({ userInfo: user }),
            activeShift: null,
            setActiveShift: (shift: any | null) => set({ activeShift: shift }),
            userCurrency: 'KES',
            setUserCurrency: (currency: string) => set({ userCurrency: currency }),
        }),
        {
            name: 'shopflow-app-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
)
