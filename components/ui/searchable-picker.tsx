"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export interface SearchablePickerOption {
    value: string
    label: string
    keywords?: string
    secondaryLabel?: string
}

export function SearchablePicker({
    value,
    options,
    onValueChange,
    placeholder,
    searchPlaceholder,
    emptyMessage = "No matching results.",
    disabled,
    id,
    columns,
}: {
    value: string
    options: SearchablePickerOption[]
    onValueChange: (value: string) => void
    placeholder: string
    searchPlaceholder: string
    emptyMessage?: string
    disabled?: boolean
    id?: string
    columns?: { primary: string; secondary: string }
}) {
    const [open, setOpen] = useState(false)
    const selected = options.find((option) => option.value === value)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    id={id}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="h-10 w-full justify-between font-normal"
                >
                    <span className="truncate">{selected?.label || placeholder}</span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
            </DialogTrigger>
            <DialogContent className="overflow-hidden p-0">
                <DialogHeader className="sr-only">
                    <DialogTitle>{placeholder}</DialogTitle>
                    <DialogDescription>{searchPlaceholder}</DialogDescription>
                </DialogHeader>
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    {columns && (
                        <div className="grid grid-cols-[minmax(0,1fr)_minmax(8rem,0.7fr)] gap-3 border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                            <span>{columns.primary}</span>
                            <span>{columns.secondary}</span>
                        </div>
                    )}
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                value={`${option.label} ${option.keywords || ""}`}
                                onSelect={() => {
                                    onValueChange(option.value)
                                    setOpen(false)
                                }}
                            >
                                <Check className={cn("size-4", value === option.value ? "opacity-100" : "opacity-0")} />
                                {columns ? (
                                    <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(8rem,0.7fr)] gap-3">
                                        <span className="truncate">{option.label}</span>
                                        <span className="truncate text-muted-foreground">{option.secondaryLabel || "—"}</span>
                                    </span>
                                ) : <span className="truncate">{option.label}</span>}
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    )
}
