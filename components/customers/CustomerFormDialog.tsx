"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/use-customers"
import { Customer } from "@/types/customer"
import { useAppStore } from "@/store/use-app-store"
import { Loader2 } from "lucide-react"

const customerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().optional().nullable(),
    email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
    contact: z.string().optional().nullable(),
})

type CustomerFormValues = z.infer<typeof customerSchema>

interface CustomerFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    customer?: Customer
}

export function CustomerFormDialog({ open, onOpenChange, customer }: CustomerFormDialogProps) {
    const activeShop = useAppStore((state) => state.activeShop)
    const userInfo = useAppStore((state) => state.userInfo)

    const { mutate: createCustomer, isPending: isCreating } = useCreateCustomer()
    const { mutate: updateCustomer, isPending: isUpdating } = useUpdateCustomer()

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: "",
            phone: "",
            email: "",
            contact: "",
        },
    })

    useEffect(() => {
        if (customer) {
            form.reset({
                name: customer.name,
                phone: customer.phone || "",
                email: customer.email || "",
                contact: customer.contact || "",
            })
        } else {
            form.reset({
                name: "",
                phone: "",
                email: "",
                contact: "",
            })
        }
    }, [customer, form, open])

    const onSubmit = (data: CustomerFormValues) => {
        if (customer) {
            updateCustomer({
                id: customer.id,
                data: {
                    ...data,
                    shop_id: activeShop?.id,
                }
            }, {
                onSuccess: () => onOpenChange(false)
            })
        } else {
            createCustomer({
                ...data,
                shop_id: activeShop?.id,
                created_by: userInfo?.id,
                _version: 1,
                _last_modified_at: new Date().toISOString(),
                _is_pending: false,
            }, {
                onSuccess: () => onOpenChange(false)
            })
        }
    }

    const isPending = isCreating || isUpdating

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Customer name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. 0712345678" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="email@example.com" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contact"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Person / Other Info</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Additional contact info" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {customer ? "Save Changes" : "Create Customer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
