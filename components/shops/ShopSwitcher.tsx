"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Store, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useAppStore } from "@/store/use-app-store"
import { useShops } from "@/hooks/use-shops"
import { useRouter } from "next/navigation"

export function ShopSwitcher() {
    const [open, setOpen] = React.useState(false)
    const activeShop = useAppStore((state) => state.activeShop)
    const setActiveShop = useAppStore((state) => state.setActiveShop)
    const { data: shops = [], isLoading } = useShops()
    const router = useRouter()

    const isManager = activeShop?.role === "Manager"

    if (!activeShop) return null

    // If not a manager, show static view
    if (!isManager) {
        return (
            <div className="flex items-center gap-3 w-full p-2 -ml-2 rounded-xl transition-colors select-none">
                <div className="p-2 bg-blue-600/10 rounded-lg">
                    <Store className="h-4 w-4 text-blue-500" />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] text-blue-500 uppercase tracking-widest font-black leading-none mb-1">Current Shop</p>
                    <h3 className="text-sm font-bold text-foreground truncate leading-none">
                        {activeShop.name}
                    </h3>
                </div>
            </div>
        )
    }

    // If manager, show switcher
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Select a shop"
                    className="flex h-auto items-center gap-3 w-full p-2 -ml-2 rounded-xl hover:bg-blue-600/5 transition-colors group justify-start text-left"
                >
                    <div className="p-2 bg-blue-600/10 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                        <Store className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-blue-500 uppercase tracking-widest font-black leading-none mb-1">Current Shop</p>
                        <h3 className="text-sm font-bold text-foreground truncate leading-none group-hover:text-blue-600 transition-colors">
                            {activeShop.name}
                        </h3>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                <Command>
                    <CommandList>
                        <CommandInput placeholder="Search shop..." />
                        <CommandEmpty>No shop found.</CommandEmpty>
                        <CommandGroup heading="Available Shops">
                            {shops.map((shop) => (
                                <CommandItem
                                    key={shop.id}
                                    onSelect={() => {
                                        setActiveShop({
                                            id: shop.id,
                                            name: shop.name,
                                            role: activeShop.role // Keep existing role
                                        })
                                        setOpen(false)
                                    }}
                                    className="text-sm cursor-pointer"
                                >
                                    <Store className="mr-2 h-4 w-4 bg-blue-600/10 text-blue-500 rounded p-0.5" />
                                    {shop.name}
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            activeShop.id === shop.id
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    <CommandSeparator />
                    <CommandList>
                        <CommandGroup>
                            <CommandItem
                                onSelect={() => {
                                    setOpen(false)
                                    router.push("/shop/new")
                                }}
                                className="cursor-pointer"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create New Shop
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
