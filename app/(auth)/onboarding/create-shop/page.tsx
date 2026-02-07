"use client"

import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

// Components
import { CreateShopForm } from "@/components/shops/CreateShopForm"
import { CreateShopInput } from "@/types/shop"

export default function CreateShopPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const existingUserId = searchParams.get("userId")

    const onSubmit = (data: CreateShopInput) => {
        const params = new URLSearchParams()
        params.set("type", "create")
        params.set("name", data.name)
        params.set("address", data.address)
        params.set("city", data.city)
        params.set("is_main_shop", "true")
        if (existingUserId) {
            params.set("userId", existingUserId)
        }
        router.push(`/onboarding/role?${params.toString()}`)
    }

    return (
        <div className="flex flex-col items-center space-y-6 relative">
            <Link href="/onboarding" className="absolute -top-12 left-0">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary transition-colors px-0">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </Link>

            <div className="text-center space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Create Shop</h1>
                <p className="text-sm text-muted-foreground">Enter your shop details to get started</p>
            </div>

            <CreateShopForm onSubmit={onSubmit} />
        </div>
    )
}
