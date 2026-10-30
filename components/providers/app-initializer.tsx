"use client"

import { useEffect, useSyncExternalStore } from "react"
import { useInitializeApp } from "@/hooks/use-initialize-app"
import { useAuth } from "@clerk/nextjs"
import { setApiTokenGetter } from "@/lib/api-client"
import { Loader2 } from "lucide-react"

const subscribeToMount = () => () => {}
const getMountSnapshot = () => true
const getServerMountSnapshot = () => false

export function AppInitializer({ children }: { children: React.ReactNode }) {
    const { getToken } = useAuth()
    const { isInitialized } = useInitializeApp()
    const mounted = useSyncExternalStore(
        subscribeToMount,
        getMountSnapshot,
        getServerMountSnapshot
    )

    useEffect(() => {
        setApiTokenGetter(getToken)
    }, [getToken])

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
