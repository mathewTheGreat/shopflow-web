"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, Store } from "lucide-react"

export default function OnboardingPage() {
    return (
        <div className="flex flex-col items-center space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Create Your Account</h1>
                <p className="text-sm text-muted-foreground">Choose how you want to get started</p>
            </div>

            <div className="w-full space-y-4">
                <Link href="/" className="block">
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
