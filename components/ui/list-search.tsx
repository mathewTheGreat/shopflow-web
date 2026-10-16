"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface ListSearchProps {
    placeholder?: string
    value: string
    onChange: (value: string) => void
    debounceMs?: number
}

// Debounced text search shared by every list/grid. Typing restarts the
// parent's page via onChange (parents reset page on search change).
export function ListSearch({ placeholder = "Search...", value, onChange, debounceMs = 300 }: ListSearchProps) {
    const [inner, setInner] = useState(value)

    useEffect(() => {
        setInner(value)
    }, [value])

    useEffect(() => {
        const t = setTimeout(() => {
            if (inner !== value) onChange(inner)
        }, debounceMs)
        return () => clearTimeout(t)
    }, [inner, value, onChange, debounceMs])

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                className="pl-10 h-10 bg-card"
                value={inner}
                onChange={(e) => setInner(e.target.value)}
            />
        </div>
    )
}
