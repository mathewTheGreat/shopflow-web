"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignOutButton } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Store,
    Settings,
    Moon,
    Sun,
    RefreshCw,
    LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { ShopSwitcher } from "@/components/shops/ShopSwitcher"

export function AppSidebar({ className }: { className?: string }) {
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()

    const toggleDarkMode = () => {
        setTheme(theme === "dark" ? "light" : "dark")
    }

    const isActive = (path: string) => pathname === path

    const navItems = [
        { label: "Dashboard", icon: LayoutDashboard, href: "/" },
        { label: "Sales and Expenses", icon: ShoppingCart, href: "/sales" },
        { label: "Inventory", icon: Package, href: "/inventory" },
        { label: "Shop", icon: Store, href: "/shop" },
        { label: "Settings", icon: Settings, href: "/settings" },
    ]

    return (
        <div className={cn("flex flex-col h-full bg-card text-card-foreground", className)}>
            {/* Sidebar Header - Align with Dashboard Header */}
            <div className="h-[64px] flex items-center px-6">
                <ShopSwitcher />
            </div>

            <div className="flex flex-col h-full p-6">
                {/* Navigation */}
                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-4 h-14 rounded-xl transition-all duration-200",
                                    isActive(item.href)
                                        ? "bg-blue-600/10 text-blue-500 font-semibold"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <item.icon className={cn("h-6 w-6", isActive(item.href) ? "text-blue-500" : "text-muted-foreground")} />
                                <span className="text-base">{item.label}</span>
                            </Button>
                        </Link>
                    ))}
                </nav>

                {/* Footer Actions */}
                <div className="space-y-4 pt-6 mt-auto border-t border-border/50">
                    {/* Theme Switcher */}
                    <div className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-3">
                            {theme === "dark" ? <Moon className="h-5 w-5 text-blue-500" /> : <Sun className="h-5 w-5 text-orange-500" />}
                            <span className="text-sm font-medium">Dark Mode</span>
                        </div>
                        <Switch checked={theme === "dark"} onCheckedChange={toggleDarkMode} />
                    </div>

                    {/* Sync Button */}
                    <Button
                        variant="secondary"
                        className="w-full justify-start gap-4 h-14 rounded-xl bg-muted/50 hover:bg-muted transition-all"
                    >
                        <RefreshCw className="h-6 w-6 text-blue-500" />
                        <span className="font-semibold">Sync</span>
                    </Button>

                    {/* Sign Out Button */}
                    <SignOutButton>
                        <Button
                            variant="secondary"
                            className="w-full justify-start gap-4 h-14 rounded-xl bg-muted/50 hover:bg-muted transition-all"
                        >
                            <LogOut className="h-6 w-6 text-blue-500" />
                            <span className="font-semibold">Sign Out</span>
                        </Button>
                    </SignOutButton>

                    <p className="text-center text-[10px] text-muted-foreground/50 tracking-widest uppercase py-4">
                        ShopFlow v1.0.0
                    </p>
                </div>
            </div>
        </div>
    )
}
