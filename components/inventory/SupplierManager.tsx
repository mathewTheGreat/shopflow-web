"use client"

import { useState } from "react"
import {
    ChevronLeft,
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Phone,
    Mail,
    User,
    Loader2,
    Building2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSuppliers, useDeleteSupplier } from "@/hooks/use-supplier"
import { Supplier } from "@/types/supplier"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { SupplierFormDialog } from "./SupplierFormDialog"

interface SupplierManagerProps {
    onBack: () => void
}

export function SupplierManager({ onBack }: SupplierManagerProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>()

    const { data: suppliers = [], isLoading } = useSuppliers()
    const { mutate: deleteSupplier } = useDeleteSupplier()

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.contact?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier)
        setIsFormOpen(true)
    }

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this supplier?")) {
            deleteSupplier(id)
        }
    }

    const handleAdd = () => {
        setSelectedSupplier(undefined)
        setIsFormOpen(true)
    }

    return (
        <div className="flex flex-col h-full bg-muted/30">
            {/* Header */}
            {/* Header */}
            <div className="bg-card border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-10 h-16">
                <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold tracking-tight">Suppliers</h2>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Full-width CTA */}
                    <Button onClick={handleAdd} className="w-full bg-primary hover:bg-primary/90 h-14 text-base">
                        <Plus className="h-5 w-5 mr-2" />
                        Add Supplier
                    </Button>

                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">All Suppliers ({suppliers.length})</h2>
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[300px] p-2">
                                    <Input
                                        placeholder="Search suppliers..."
                                        className="h-10"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                            <p>Loading suppliers...</p>
                        </div>
                    ) : filteredSuppliers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-card/50">
                            <Building2 className="h-16 w-16 text-muted-foreground/20 mb-4" />
                            <h3 className="text-lg font-semibold">No suppliers found</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                                {searchQuery ? "No results match your search criteria." : "Start by adding your first supplier to track inventory sources."}
                            </p>
                            {!searchQuery && (
                                <Button onClick={handleAdd}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Your First Supplier
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="border rounded-lg bg-card overflow-hidden">
                            <div className="grid grid-cols-4 p-4 border-b bg-muted/40 font-medium text-sm text-muted-foreground">
                                <div className="col-span-1">Name</div>
                                <div>Contact</div>
                                <div>Phone</div>
                                <div className="text-right">Actions</div>
                            </div>
                            <div className="divide-y">
                                {filteredSuppliers.map((supplier) => (
                                    <div key={supplier.id} className="grid grid-cols-4 p-4 items-center hover:bg-muted/50 transition-colors cursor-pointer text-sm">
                                        <div className="font-medium text-foreground">{supplier.name}</div>
                                        <div className="text-muted-foreground">{supplier.contact || "-"}</div>
                                        <div className="text-muted-foreground">{supplier.phone || "-"}</div>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEdit(supplier)
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDelete(supplier.id)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <SupplierFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                supplier={selectedSupplier}
            />
        </div>
    )
}
