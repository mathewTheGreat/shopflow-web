"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    ShoppingCart,
    Package,
    Store,
    Moon,
    RefreshCw,
    LogOut,
    User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export function AppSidebar({ className }: { className?: string }) {
    const pathname = usePathname()
    const [isDarkMode, setIsDarkMode] = useState(true)

    useEffect(() => {
        // Check initial state from DOM
        if (document.documentElement.classList.contains("dark")) {
            setIsDarkMode(true)
        } else {
            setIsDarkMode(false)
        }
    }, [])

    const toggleDarkMode = () => {
        const newMode = !isDarkMode
        setIsDarkMode(newMode)
        if (newMode) {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }
    }

    const isActive = (path: string) => pathname === path

    return (
        <div className={cn("flex flex-col h-full bg-background", className)}>
            <div className="flex items-center gap-3 pb-6 pt-4 px-2">
                <User className="h-12 w-12 text-primary" />
                <div>
                    <h2 className="text-xl font-semibold">Welcome back!</h2>
                </div>
            </div>

            <nav className="flex flex-col gap-2 flex-1">
                <Link href="/">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start gap-3 h-14",
                            isActive("/") && "bg-accent"
                        )}
                        size="lg"
                    >
                        <div className="grid h-8 w-8 place-items-center rounded-md border-2 border-muted-foreground/20">
                            <div className="grid grid-cols-2 gap-0.5">
                                <div className={cn("h-1.5 w-1.5 rounded-sm", isActive("/") ? "bg-primary" : "bg-muted-foreground")} />
                                <div className={cn("h-1.5 w-1.5 rounded-sm", isActive("/") ? "bg-primary" : "bg-muted-foreground")} />
                                <div className={cn("h-1.5 w-1.5 rounded-sm", isActive("/") ? "bg-primary" : "bg-muted-foreground")} />
                                <div className={cn("h-1.5 w-1.5 rounded-sm", isActive("/") ? "bg-primary" : "bg-muted-foreground")} />
                            </div>
                        </div>
                        <span className="text-base">Dashboard</span>
                    </Button>
                </Link>
                <Link href="/sales">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start gap-3 h-14",
                            isActive("/sales") && "bg-accent"
                        )}
                        size="lg"
                    >
                        <ShoppingCart className="h-8 w-8" />
                        <span className="text-base">Sales and Expenses</span>
                    </Button>
                </Link>
                <Button variant="ghost" className="justify-start gap-3 h-14" size="lg">
                    <Package className="h-8 w-8" />
                    <span className="text-base">Inventory</span>
                </Button>
                <Button variant="ghost" className="justify-start gap-3 h-14" size="lg">
                    <Store className="h-8 w-8" />
                    <span className="text-base">Shop</span>
                </Button>
            </nav>

            <div className="space-y-2 mt-auto pt-4 border-t border-border">
                <div className="flex items-center justify-between rounded-lg p-3">
                    <div className="flex items-center gap-2">
                        <Moon className="h-5 w-5" />
                        <span className="text-sm">Dark Mode</span>
                    </div>
                    <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                </div>
                <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
                    <RefreshCw className="h-5 w-5" />
                    <span>Sync</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                </Button>
                <p className="text-center text-xs text-muted-foreground pt-4 pb-2">ShopFlow v1.0.0</p>
            </div>
        </div>
    )
}
