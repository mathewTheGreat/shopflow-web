"use client"

import { useState } from "react"
import {
    ChevronLeft,
    Plus,
    Edit,
    Trash2,
    Users,
    Loader2,
    Phone,
    Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCustomersByShop, useDeleteCustomer } from "@/hooks/use-customers"
import { ListSearch } from "@/components/ui/list-search"
import { ListPagination } from "@/components/ui/list-pagination"
import { Customer } from "@/types/customer"
import { useAppStore } from "@/store/use-app-store"
import { CustomerFormDialog } from "./CustomerFormDialog"

interface CustomerManagerProps {
    onBack?: () => void
}

export function CustomerManager({ onBack }: CustomerManagerProps) {
    const activeShop = useAppStore((state) => state.activeShop)
    const [searchQuery, setSearchQuery] = useState("")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>()

    const [page, setPage] = useState(1)
    const { customers = [], pagination, isLoading } = useCustomersByShop(activeShop?.id, {
        search: searchQuery,
        page,
        limit: 20,
    })
    const { mutate: deleteCustomer } = useDeleteCustomer()

    const filteredCustomers = customers

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer)
        setIsFormOpen(true)
    }

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this customer? This will NOT affect their transaction history but will remove them from selection.")) {
            deleteCustomer(id)
        }
    }

    const handleAdd = () => {
        setSelectedCustomer(undefined)
        setIsFormOpen(true)
    }

    return (
        <div className="flex flex-col h-full bg-muted/30">
            {/* Header */}
            <div className="bg-card border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-10 h-16">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                )}
                <div className="flex-1">
                    <h2 className="text-xl font-bold tracking-tight">Customer Management</h2>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Full-width CTA */}
                    <Button onClick={handleAdd} className="w-full bg-primary hover:bg-primary/90 h-14 text-base shadow-lg">
                        <Plus className="h-5 w-5 mr-2" />
                        Add New Customer
                    </Button>

                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold">Our Customers ({pagination?.total ?? customers.length})</h2>
                        <div className="w-[300px]">
                            <ListSearch
                                placeholder="Search by name, phone or email..."
                                value={searchQuery}
                                onChange={(v) => { setSearchQuery(v); setPage(1) }}
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                            <p className="text-muted-foreground">Loading customers...</p>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl bg-card/50 px-6">
                            <div className="bg-primary/5 p-6 rounded-full mb-6">
                                <Users className="h-16 w-16 text-primary/20" />
                            </div>
                            <h3 className="text-2xl font-bold">No customers found</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                                {searchQuery
                                    ? "We couldn't find any customers matching your search."
                                    : "Building a customer base helps track credit sales and personalized relationships."}
                            </p>
                            {!searchQuery && (
                                <Button onClick={handleAdd} size="lg" className="rounded-full px-8">
                                    <Plus className="h-5 w-5 mr-2" />
                                    Add Your First Customer
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto pb-4">
                            <div className="border rounded-lg bg-card overflow-hidden min-w-[550px]">
                                <div className="grid grid-cols-4 p-4 border-b bg-muted/40 font-medium text-sm text-muted-foreground">
                                    <div className="col-span-1">Name</div>
                                    <div>Email</div>
                                    <div>Phone</div>
                                    <div className="text-right">Actions</div>
                                </div>
                                <div className="divide-y">
                                    {filteredCustomers.map((customer) => (
                                        <div key={customer.id} className="grid grid-cols-4 p-4 items-center hover:bg-muted/50 transition-colors cursor-pointer text-sm" onClick={() => handleEdit(customer)}>
                                            <div className="font-medium text-foreground">{customer.name}</div>
                                            <div className="text-muted-foreground truncate pr-4">{customer.email || "-"}</div>
                                            <div className="text-muted-foreground">{customer.phone || "-"}</div>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-primary hover:text-primary/90 hover:bg-primary/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleEdit(customer)
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
                                                        handleDelete(customer.id)
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-4">
                                    <ListPagination pagination={pagination} onPageChange={setPage} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <CustomerFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                customer={selectedCustomer}
            />
        </div>
    )
}
