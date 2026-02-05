"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateSupplier, useUpdateSupplier } from "@/hooks/use-supplier"
import { Supplier } from "@/types/supplier"
import { Loader2 } from "lucide-react"
import { useAppStore } from "@/store/use-app-store"

interface SupplierFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    supplier?: Supplier
}

export function SupplierFormDialog({ open, onOpenChange, supplier }: SupplierFormDialogProps) {
    const [name, setName] = useState("")
    const [contact, setContact] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")

    const { mutate: createSupplier, isPending: isCreating } = useCreateSupplier()
    const { mutate: updateSupplier, isPending: isUpdating } = useUpdateSupplier()
    const activeShop = useAppStore((state) => state.activeShop)
    const userInfo = useAppStore((state) => state.userInfo)

    useEffect(() => {
        if (supplier) {
            setName(supplier.name || "")
            setContact(supplier.contact || "")
            setPhone(supplier.phone || "")
            setEmail(supplier.email || "")
        } else {
            setName("")
            setContact("")
            setPhone("")
            setEmail("")
        }
    }, [supplier, open])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const data = {
            name,
            contact,
            phone,
            email,
            shop_id: activeShop?.id,
            created_by: userInfo?.id
        }

        if (supplier) {
            updateSupplier({ id: supplier.id, data }, {
                onSuccess: () => onOpenChange(false)
            })
        } else {
            createSupplier(data, {
                onSuccess: () => onOpenChange(false)
            })
        }
    }

    const isSubmitting = isCreating || isUpdating

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{supplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Supplier Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="e.g. Acme Corp"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="contact">Contact Person</Label>
                            <Input
                                id="contact"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. +254 700 000 000"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="e.g. supplier@example.com"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {supplier ? "Save Changes" : "Create Supplier"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
