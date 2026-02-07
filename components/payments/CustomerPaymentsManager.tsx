"use client"

import { useState } from "react"
import {
    ChevronLeft,
    Plus,
    Search,
    Filter,
    ArrowDownLeft,
    ArrowUpRight,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useShopTransactions } from "@/hooks/use-customer-payments"
import { useAppStore } from "@/store/use-app-store"
import { PaymentRecordDialog } from "./PaymentRecordDialog"
import { cn } from "@/lib/utils"

interface CustomerPaymentsManagerProps {
    onBack?: () => void
}

export function CustomerPaymentsManager({ onBack }: CustomerPaymentsManagerProps) {
    const activeShop = useAppStore((state) => state.activeShop)
    const [searchQuery, setSearchQuery] = useState("")
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false)
    const [transactionType, setTransactionType] = useState<"CREDIT" | "DEBIT">("CREDIT")

    const { data: transactions = [], isLoading } = useShopTransactions(activeShop?.id)

    const filteredTransactions = transactions.filter(t =>
        t.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleRecordTransaction = (type: "CREDIT" | "DEBIT") => {
        setTransactionType(type)
        setIsPaymentFormOpen(true)
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
                    <h2 className="text-xl font-bold tracking-tight">Customer Payments</h2>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            onClick={() => handleRecordTransaction("DEBIT")}
                            className="h-14 text-base bg-orange-600 hover:bg-orange-700 shadow-lg text-white"
                        >
                            <ArrowUpRight className="h-5 w-5 mr-2" />
                            Record Charge (Debit)
                        </Button>
                        <Button
                            onClick={() => handleRecordTransaction("CREDIT")}
                            className="h-14 text-base bg-emerald-600 hover:bg-emerald-700 shadow-lg text-white"
                        >
                            <ArrowDownLeft className="h-5 w-5 mr-2" />
                            Record Payment (Credit)
                        </Button>
                    </div>

                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Recent Transactions</h2>
                        <div className="flex gap-2">
                            <div className="relative w-[300px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by customer or notes..."
                                    className="pl-10 h-10 bg-card"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                            <p className="text-muted-foreground">Loading transactions...</p>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl bg-card/50 px-6">
                            <div className="bg-primary/5 p-6 rounded-full mb-6">
                                <ArrowDownLeft className="h-16 w-16 text-primary/20" />
                            </div>
                            <h3 className="text-2xl font-bold">No transactions found</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                                Start recording customer payments and charges to track balances.
                            </p>
                        </div>
                    ) : (
                        <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
                            <div className="grid grid-cols-12 p-4 border-b bg-muted/40 font-medium text-sm text-muted-foreground gap-4">
                                <div className="col-span-3">Customer</div>
                                <div className="col-span-2">Type</div>
                                <div className="col-span-2">Method</div>
                                <div className="col-span-2">Amount</div>
                                <div className="col-span-3 text-right">Date</div>
                            </div>
                            <div className="divide-y">
                                {filteredTransactions.map((transaction) => (
                                    <div key={transaction.id} className="grid grid-cols-12 p-4 items-center hover:bg-muted/50 transition-colors text-sm gap-4">
                                        <div className="col-span-3 font-medium text-foreground truncate" title={transaction.customerName}>
                                            {transaction.customerName || "Unknown Customer"}
                                            {transaction.notes && (
                                                <div className="text-xs text-muted-foreground truncate font-normal mt-0.5">
                                                    {transaction.notes}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-span-2">
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                                transaction.type === 'CREDIT'
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                                    : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                                            )}>
                                                {transaction.type}
                                            </span>
                                        </div>
                                        <div className="col-span-2 text-muted-foreground text-xs uppercase font-semibold">
                                            {transaction.payment_method}
                                        </div>
                                        <div className={cn(
                                            "col-span-2 font-bold",
                                            transaction.type === 'CREDIT' ? "text-emerald-600" : "text-orange-600"
                                        )}>
                                            {transaction.type === 'CREDIT' ? "+" : "-"}
                                            KES {transaction.amount.toLocaleString()}
                                        </div>
                                        <div className="col-span-3 text-right text-muted-foreground text-xs">
                                            {new Date(transaction.created_at).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: 'numeric',
                                                hour12: true
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <PaymentRecordDialog
                open={isPaymentFormOpen}
                onOpenChange={setIsPaymentFormOpen}
                defaultType={transactionType}
            />
        </div>
    )
}
