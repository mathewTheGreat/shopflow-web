"use client"

import { useState } from "react"
import {
    ChevronLeft,
    ArrowDownLeft,
    ArrowUpRight,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useShopTransactions, useReverseCustomerTransaction } from "@/hooks/use-customer-payments"
import { ListSearch } from "@/components/ui/list-search"
import { ListPagination } from "@/components/ui/list-pagination"
import { ReasonDialog } from "@/components/ui/reason-dialog"
import { useAppStore } from "@/store/use-app-store"
import { PaymentRecordDialog } from "./PaymentRecordDialog"
import { cn } from "@/lib/utils"

interface CustomerPaymentsManagerProps {
    onBack?: () => void
}

export function CustomerPaymentsManager({ onBack }: CustomerPaymentsManagerProps) {
    const activeShop = useAppStore((state) => state.activeShop)
    const isManager = activeShop?.role === "Manager"
    const [searchQuery, setSearchQuery] = useState("")
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false)
    const [transactionType, setTransactionType] = useState<"CREDIT" | "DEBIT">("CREDIT")

    const [page, setPage] = useState(1)
    const { transactions = [], pagination, isLoading } = useShopTransactions(activeShop?.id, {
        search: searchQuery,
        page,
        limit: 20,
    })
    const { mutateAsync: reverseTransaction, isPending: isReversing } = useReverseCustomerTransaction()

    const reversedIds = new Set(
        transactions.filter(t => t.reversal_of).map(t => String(t.reversal_of))
    )

    const filteredTransactions = transactions

    const [reverseTarget, setReverseTarget] = useState<string | null>(null)

    const handleReverse = async (id: string, reason: string) => {
        try {
            await reverseTransaction({ id, reason })
            setReverseTarget(null)
        } catch {
            // toast handled in the mutation
        }
    }

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

                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold">Recent Transactions</h2>
                        <div className="w-[300px]">
                            <ListSearch
                                placeholder="Search by customer or notes..."
                                value={searchQuery}
                                onChange={(v) => { setSearchQuery(v); setPage(1) }}
                            />
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
                                            {(transaction.reversal_of || reversedIds.has(transaction.id)) && (
                                                <span className="ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                    {transaction.reversal_of ? "Reversal" : "Reversed"}
                                                </span>
                                            )}
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
                                            {isManager && !transaction.reversal_of && !reversedIds.has(transaction.id) && (
                                                <div className="mt-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={isReversing}
                                                        onClick={() => setReverseTarget(transaction.id)}
                                                    >
                                                        Reverse
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-4">
                                <ListPagination pagination={pagination} onPageChange={setPage} />
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

            <ReasonDialog
                open={reverseTarget !== null}
                onOpenChange={(open) => { if (!open) setReverseTarget(null) }}
                title="Reverse customer transaction"
                description="The exact opposite entry will be recorded and linked to the original."
                confirmLabel="Reverse Transaction"
                isSubmitting={isReversing}
                onSubmit={(reason) => { if (reverseTarget) handleReverse(reverseTarget, reason) }}
            />
        </div>
    )
}
