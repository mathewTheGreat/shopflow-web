"use client"

import { useEffect, useState } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, Store, Loader2, LogOut } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export default function OnboardingPage() {
    const { user, isLoaded } = useUser()
    const { signOut } = useClerk()
    const router = useRouter()
    const [dbUser, setDbUser] = useState<any>(null)
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        if (!isLoaded || !user) return

        const checkUser = async () => {
            try {
                // Check if user exists in the database
                const existingUser = await apiClient.get<any>(`${process.env.NEXT_PUBLIC_API_URL}/api/users/clerk/${user.id}`)
                setDbUser(existingUser)

                // check if user has a shop assigned 
                await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/shop-staff/users/${user.id}`)

                router.push("/")
            } catch (error: any) {
                // If 404 from shop-staff check, user exists but isn't assigned
                // If 404 from users check, user truly doesn't exist
                if (error.status === 404) {
                    setIsChecking(false)
                } else {
                    console.error("Error checking user status:", error)
                    setIsChecking(false)
                }
            }
        }

        checkUser()
    }, [isLoaded, user, router])

    if (!isLoaded || isChecking) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Create Your Account</h1>
                <p className="text-sm text-muted-foreground">Choose how you want to get started</p>
            </div>

            <div className="w-full space-y-4">
                <Link href={`/onboarding/create-shop${dbUser ? `?userId=${dbUser.id}` : ''}`} className="block">
                    <Button className="w-full h-16 text-lg bg-primary hover:bg-primary/90 text-white justify-center gap-3">
                        <User className="h-6 w-6" />
                        Create New Account &rarr;
                    </Button>
                </Link>
                <Link href={`/onboarding/join${dbUser ? `?userId=${dbUser.id}` : ''}`} className="block">
                    <Button variant="outline" className="w-full h-16 text-lg bg-transparent border-primary/30 hover:border-primary hover:bg-primary/10 text-primary justify-center gap-3">
                        <Store className="h-6 w-6" />
                        Join Existing Business &rarr;
                    </Button>
                </Link>
            </div>

            <div className="pt-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut(() => router.push("/sign-in"))}
                    className="text-muted-foreground hover:text-red-600 transition-colors"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Back to Sign In
                </Button>
            </div>
        </div>
    )
}
