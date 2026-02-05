"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useAppStore } from "@/store/use-app-store"
import { userService } from "@/services/user.service"
import { shopService } from "@/services/shop.service"
import { shiftService } from "@/services/shift.service"
import { roleService } from "@/services/role.service"

export function useInitializeApp() {
    const { user: clerkUser, isLoaded: isClerkLoaded } = useUser()
    const { setUserInfo, setActiveShop, setActiveShift } = useAppStore()
    const [isInitialized, setIsInitialized] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        const initialize = async () => {
            if (!isClerkLoaded || !clerkUser) {
                if (isClerkLoaded && !clerkUser) {
                    setIsInitialized(true) // Not logged in, but initialized
                }
                return
            }

            try {
                // 1. Get Local User
                const dbUser = await userService.getUserByClerkId(clerkUser.id)
                setUserInfo({
                    id: dbUser.id,
                    name: dbUser.name,
                    email: dbUser.email
                })
                // 2. Get Shop Staff / Shop
                try {
                    const staffRecord = await userService.getShopStaffByUser(dbUser.id)
                    if (staffRecord && staffRecord[0].shop_id) {
                        const shopId = staffRecord[0].shop_id
                        const roleId = staffRecord[0].role_id

                        const [shopData, roleData] = await Promise.all([
                            shopService.getShop(shopId),
                            roleId ? roleService.getRole(roleId) : Promise.resolve(null)
                        ])

                        setActiveShop({
                            id: shopData.id,
                            name: shopData.name,
                            role: roleData?.name || 'None'
                        })
                    }
                } catch (staffErr) {
                    console.warn("No shop assigned to user yet")
                    setActiveShop(null)
                }

                // 3. Get Current Shift
                try {
                    const activeShop = useAppStore.getState().activeShop
                    if (dbUser.id && activeShop?.id) {
                        const currentShift = await shiftService.getCurrentShift(dbUser.id, activeShop.id)
                        setActiveShift(currentShift)
                    }
                } catch (shiftErr) {
                    console.warn("No active shift found")
                    setActiveShift(null)
                }

                setIsInitialized(true)
            } catch (err: any) {
                console.error("Initialization error:", err)
                setError(err instanceof Error ? err : new Error(String(err)))
                setIsInitialized(true) // Still mark as initialized to stop loading state
            }
        }

        initialize()
    }, [isClerkLoaded, clerkUser, setUserInfo, setActiveShop, setActiveShift])

    return { isInitialized, error }
}
