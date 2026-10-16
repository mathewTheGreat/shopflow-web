"use client"

import { useEffect, useState } from "react"
import { useInitializeApp } from "@/hooks/use-initialize-app"
import { useAuth } from "@clerk/nextjs"
import { setApiTokenGetter } from "@/lib/api-client"
import { Loader2 } from "lucide-react"

export function AppInitializer({ children }: { children: React.ReactNode }) {
    const { getToken } = useAuth()
    const { isInitialized } = useInitializeApp()
    // Gate on mount so the server prerender and the first client render are
    // structurally identical; the app content only swaps in post-hydration.
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setApiTokenGetter(getToken)
    }, [getToken])

    useEffect(() => {
        setMounted(true)
    }, [])

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
