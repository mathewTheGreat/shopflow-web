"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2, ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

const ROLES = {
    MANAGER: "f84dc3cb-6e95-458f-83d0-12124abb0c80",
    CASHIER: "2fb92608-7257-485d-9c58-14ed6586d6b9"
} as const

export default function RoleSelectionPage() {
    const { user, isLoaded: userLoaded } = useUser()
    const router = useRouter()
    const searchParams = useSearchParams()

    const [selectedRole, setSelectedRole] = useState<typeof ROLES[keyof typeof ROLES] | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const type = searchParams.get("type")
    const shopId = searchParams.get("shopId")
    const name = searchParams.get("name")
    const address = searchParams.get("address")
    const city = searchParams.get("city")

    const handleComplete = async () => {
        if (!selectedRole || !userLoaded || !user) return

        setIsSubmitting(true)

        const now = new Date().toISOString()
        const isMainShop = searchParams.get("is_main_shop") === "true"
        const existingUserId = searchParams.get("userId")

        // 1. Prepare User Entity
        const userEntity = {
            id: existingUserId || crypto.randomUUID(), // Use existing DB ID if we found one earlier
            name: user.fullName || user.primaryEmailAddress?.emailAddress || "",
            email: user.primaryEmailAddress?.emailAddress || "",
            created_at: now,
            last_login: now,
            clerkId: user.id,
        }

        // 2. Prepare Shop Entity (if creating)
        let shopEntity = null
        if (type === 'create') {
            shopEntity = {
                id: crypto.randomUUID(),
                name: name || "",
                address: address || "",
                city: city || "",
                is_main_shop: isMainShop,
                created_at: now,
                created_by: userEntity.id,
            }
        }

        // 3. Prepare ShopStaff Entity
        const shopStaffEntity = {
            id: crypto.randomUUID(),
            user_id: userEntity.id,
            shop_id: type === 'create' ? shopEntity?.id : shopId,
            role_id: selectedRole,
            created_at: now,
            created_by: userEntity.id,
        }

        // LOG ALL DATA BEFORE SUBMISSION
        console.log("--- ONBOARDING SUBMISSION DATA ---")
        console.log("User Entity:", userEntity)
        console.log("Shop Entity:", shopEntity || `Joining existing shop: ${shopId}`)
        console.log("ShopStaff Entity:", shopStaffEntity)
        console.log("----------------------------------")

        try {
            // 1. Create User in Local DB if they don't exist yet
            if (!existingUserId) {
                console.log("Creating new user in database...")
                await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, userEntity)
            } else {
                console.log("User already exists in database, skipping user creation.")
            }

            // 2. Create Shop in Local DB if creating a new one
            if (type === 'create' && shopEntity) {
                console.log("Creating new shop in database...")
                await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/shops`, shopEntity)
            }

            // 3. Create ShopStaff entry to link user and shop
            console.log("Creating shop staff assignment...")
            await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/shop-staff`, shopStaffEntity)

            toast.success("Setup complete!")

            // Wait a moment for the DB to sync then redirect
            setTimeout(() => {
                router.push("/")
            }, 1500)

        } catch (error: any) {
            console.error("Submission error:", error)
            toast.error(error.message || "Failed to complete setup")
        } finally {
            setIsSubmitting(false)
        }
    }

    const backPath = type === 'create' ? '/onboarding/create-shop' : '/onboarding/join'

    return (
        <div className="flex flex-col items-center space-y-6 relative">
            <Link href={backPath} className="absolute -top-12 left-0">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-600 transition-colors px-0">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </Link>

            <div className="text-center space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Select Your Role</h1>
                <p className="text-sm text-muted-foreground">Choose your position in the shop</p>
            </div>

            <div className="w-full space-y-4">
                <Card
                    className={`bg-card border transition-all cursor-pointer ${selectedRole === ROLES.MANAGER ? 'border-blue-600 ring-1 ring-blue-600' : 'border-border hover:border-muted-foreground/50'}`}
                    onClick={() => setSelectedRole(ROLES.MANAGER)}
                >
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-1">Manager</h3>
                        <p className="text-sm text-muted-foreground">Full access to manage shop and staff</p>
                    </CardContent>
                </Card>

                <Card
                    className={`bg-card border transition-all cursor-pointer ${selectedRole === ROLES.CASHIER ? 'border-blue-600 ring-1 ring-blue-600' : 'border-border hover:border-muted-foreground/50'}`}
                    onClick={() => setSelectedRole(ROLES.CASHIER)}
                >
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-1">Cashier</h3>
                        <p className="text-sm text-muted-foreground">Handle sales and basic customer transactions</p>
                    </CardContent>
                </Card>
            </div>

            <div className="w-full pt-8">
                <Button
                    onClick={handleComplete}
                    className="w-full h-14 text-base bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!selectedRole || isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Completing Setup...
                        </>
                    ) : (
                        <>
                            <ArrowRight className="mr-2 h-5 w-5" />
                            Complete Setup
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
