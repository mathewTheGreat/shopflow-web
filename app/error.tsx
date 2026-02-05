"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCcw } from "lucide-react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <div className="rounded-full bg-destructive/10 p-4 mb-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                An unexpected error occurred. We've been notified and are working on it.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => reset()} variant="default">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Try again
                </Button>
                <Button onClick={() => (window.location.href = "/")} variant="outline">
                    Go Home
                </Button>
            </div>
        </div>
    )
}
