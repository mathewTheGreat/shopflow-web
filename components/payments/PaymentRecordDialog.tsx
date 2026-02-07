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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRecordPayment, useRecordWithdrawal } from "@/hooks/use-customer-payments"
import { useCustomersByShop } from "@/hooks/use-customers"
import { useAppStore } from "@/store/use-app-store"
import { Loader2 } from "lucide-react"

const paymentSchema = z.object({
    customer_id: z.string().min(1, "Customer is required"),
    type: z.enum(["CREDIT", "DEBIT"]),
    amount: z.coerce.number().min(1, "Amount must be greater than 0"),
    payment_method: z.enum(["CASH", "MPESA", "CARD", "BANK_TRANSFER", "OTHER"]),
    notes: z.string().optional(),
})

type PaymentFormValues = z.infer<typeof paymentSchema>

interface PaymentRecordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultType?: "CREDIT" | "DEBIT"
    preselectedCustomerId?: string
}

export function PaymentRecordDialog({
    open,
    onOpenChange,
    defaultType = "CREDIT",
    preselectedCustomerId
}: PaymentRecordDialogProps) {
    const activeShop = useAppStore((state) => state.activeShop)
    const userInfo = useAppStore((state) => state.userInfo)
    const activeShift = useAppStore((state) => state.activeShift)

    const { data: customers = [] } = useCustomersByShop(activeShop?.id)
    const { mutate: recordPayment, isPending: isPaymentPending } = useRecordPayment()
    const { mutate: recordWithdrawal, isPending: isWithdrawalPending } = useRecordWithdrawal()

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            customer_id: preselectedCustomerId || "",
            type: defaultType,
            amount: 0,
            payment_method: "CASH",
            notes: "",
        },
    })

    useEffect(() => {
        if (open) {
            form.reset({
                customer_id: preselectedCustomerId || "",
                type: defaultType,
                amount: 0,
                payment_method: "CASH",
                notes: "",
            })
        }
    }, [open, preselectedCustomerId, defaultType, form])

    const onSubmit = (data: PaymentFormValues) => {
        if (!userInfo?.id) return;

        const commonData = {
            customer_id: data.customer_id,
            amount: data.amount,
            created_by: userInfo.id,
            payment_method: data.payment_method,
            shift_id: activeShift?.id,
            notes: data.notes,
        }

        if (data.type === "CREDIT") {
            recordPayment(commonData, {
                onSuccess: () => onOpenChange(false)
            })
        } else {
            recordWithdrawal(commonData, {
                onSuccess: () => onOpenChange(false)
            })
        }
    }

    const isPending = isPaymentPending || isWithdrawalPending
    const transactionType = form.watch("type")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        Record {transactionType === "CREDIT" ? "Payment" : "Charge"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transaction Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="CREDIT">Payment (Customer Pays)</SelectItem>
                                            <SelectItem value="DEBIT">Charge (Customer Owes)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="customer_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!preselectedCustomerId}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select customer" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {customers.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id}>
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount (KES)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="payment_method"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment Method</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select method" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="CASH">Cash</SelectItem>
                                            <SelectItem value="MPESA">M-Pesa</SelectItem>
                                            <SelectItem value="CARD">Card</SelectItem>
                                            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                            <SelectItem value="OTHER">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Reference number, description..." {...field} />
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
                                Record Transaction
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
