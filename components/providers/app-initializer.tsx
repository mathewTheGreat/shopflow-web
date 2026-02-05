"use client"

import { useInitializeApp } from "@/hooks/use-initialize-app"
import { Loader2 } from "lucide-react"

export function AppInitializer({ children }: { children: React.ReactNode }) {
    const { isInitialized } = useInitializeApp()

    if (!isInitialized) {
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
