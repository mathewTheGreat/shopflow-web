"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useAppStore } from "@/store/use-app-store"
import { userService } from "@/services/user.service"
import { shopService } from "@/services/shop.service"
import { shiftService } from "@/services/shift.service"
import { roleService } from "@/services/role.service"

type ApiError = Error & { status?: number }

export function useInitializeApp(apiTokenGetterReady: boolean) {
    const { user: clerkUser, isLoaded: isClerkLoaded } = useUser()
    const { setUserInfo, setActiveShop, setActiveShift } = useAppStore()
    const [isInitialized, setIsInitialized] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        const initialize = async () => {
            if (!apiTokenGetterReady) {
                console.info("[AuthFlow] Waiting for Clerk token getter")
                return
            }
            if (!isClerkLoaded || !clerkUser) {
                if (isClerkLoaded && !clerkUser) {
                    console.info("[AuthFlow] No signed-in Clerk user")
                    setIsInitialized(true) // Not logged in, but initialized
                }
                return
            }

            try {
                console.info("[AuthFlow] Resolving ShopFlow user")
                const dbUser = await userService.getUserByClerkId(clerkUser.id)
                console.info("[AuthFlow] ShopFlow user resolved")
                setUserInfo({
                    id: dbUser.id,
                    name: dbUser.name,
                    email: dbUser.email
                })

                try {
                    const staffRecord = await userService.getShopStaffByUser(dbUser.id)
                    const assignment = staffRecord?.[0]
                    if (assignment?.shop_id) {
                        const shopId = assignment.shop_id
                        const roleId = assignment.role_id

                        const [shopData, roleData] = await Promise.all([
                            shopService.getShop(shopId),
                            roleId ? roleService.getRole(roleId) : Promise.resolve(null)
                        ])

                        setActiveShop({
                            id: shopData.id,
                            name: shopData.name,
                            role: roleData?.name || 'None'
                        })
                        console.info("[AuthFlow] Shop assignment resolved", {
                            assignmentFound: true,
                            shopResolved: true,
                            roleResolved: Boolean(roleData)
                        })
                    } else {
                        console.info("[AuthFlow] User has no shop assignment", {
                            assignmentCount: staffRecord?.length ?? 0
                        })
                        setActiveShop(null)
                    }
                } catch (staffError) {
                    const status = (staffError as ApiError)?.status
                    console.error("[AuthFlow] Shop assignment lookup failed", {
                        status: status ?? null,
                        message: staffError instanceof Error ? staffError.message : String(staffError)
                    })
                    setActiveShop(null)
                }

                try {
                    const activeShop = useAppStore.getState().activeShop
                    if (dbUser.id && activeShop?.id) {
                        const currentShift = await shiftService.getCurrentShift(dbUser.id, activeShop.id)
                        setActiveShift(currentShift)
                        console.info("[AuthFlow] Current shift lookup completed", {
                            shiftFound: Boolean(currentShift)
                        })
                    }
                } catch (shiftError) {
                    console.error("[AuthFlow] Current shift lookup failed", {
                        status: (shiftError as ApiError)?.status ?? null,
                        message: shiftError instanceof Error ? shiftError.message : String(shiftError)
                    })
                    setActiveShift(null)
                }

                setIsInitialized(true)
            } catch (err) {
                console.error("[AuthFlow] App initialization failed", {
                    status: (err as ApiError)?.status ?? null,
                    message: err instanceof Error ? err.message : String(err)
                })
                setError(err instanceof Error ? err : new Error(String(err)))
                setIsInitialized(true) // Still mark as initialized to stop loading state
            }
        }

        initialize()
    }, [apiTokenGetterReady, isClerkLoaded, clerkUser, setUserInfo, setActiveShop, setActiveShift])

    return { isInitialized, error }
}
