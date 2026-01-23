"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, Store, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export default function OnboardingPage() {
    const { user, isLoaded } = useUser()
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        if (!isLoaded || !user) return

        const checkUser = async () => {
            try {
                // Check if user exists in the database
                await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/clerk/${user.id}`)

                // If the request succeeds (200 OK), the user exists
                // Redirect to dashboard as they don't need onboarding
                router.push("/")
            } catch (error: any) {
                // If 404, user doesn't exist, proceed with onboarding
                if (error.status === 404) {
                    setIsChecking(false)
                } else {
                    console.error("Error checking user status:", error)
                    // If unexpected error, maybe still let them try or show error
                    // For now, let's allow them to see the page but log the error
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
                <Link href="/onboarding/create-store" className="block">
                    <Button className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-700 text-white justify-center gap-3">
                        <User className="h-6 w-6" />
                        Create New Account &rarr;
                    </Button>
                </Link>
                <Link href="/onboarding/join" className="block">
                    <Button variant="outline" className="w-full h-16 text-lg bg-transparent border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/10 text-blue-500 justify-center gap-3">
                        <Store className="h-6 w-6" />
                        Join Existing Business &rarr;
                    </Button>
                </Link>
            </div>
        </div>
    )
}
