"use client"

import { useEffect, useState } from "react"
import { useInitializeApp } from "@/hooks/use-initialize-app"
import { useAuth } from "@clerk/nextjs"
import { setApiTokenGetter } from "@/lib/api-client"
import { Loader2 } from "lucide-react"

export function AppInitializer({ children }: { children: React.ReactNode }) {
    const { getToken, isLoaded: isAuthLoaded } = useAuth()
    const [apiTokenGetterReady, setApiTokenGetterReady] = useState(false)
    const { isInitialized } = useInitializeApp(apiTokenGetterReady)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!isAuthLoaded) return
        setApiTokenGetter(getToken)
        setApiTokenGetterReady(true)
        console.info("[AuthFlow] Clerk token getter is ready")
    }, [getToken, isAuthLoaded])

    if (!mounted || !isInitialized) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Initializing application...</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
