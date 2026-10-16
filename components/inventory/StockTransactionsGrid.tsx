"use client"

import { useState } from "react"
import { Loader2, ClipboardList } from "lucide-react"
import { useStockTransactionsByShop, useReverseStockTransaction } from "@/hooks/use-stock-transactions"
import { useAppStore } from "@/store/use-app-store"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { ListSearch } from "@/components/ui/list-search"
import { ListPagination } from "@/components/ui/list-pagination"
import { ReasonDialog } from "@/components/ui/reason-dialog"
import { formatQty } from "@/lib/utils"

const transactionTypeColors = {
    IN: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    OUT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    TRANSFER_IN: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
    TRANSFER_OUT: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    ADJUSTMENT: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
}

export function StockTransactionsGrid() {
    const activeShop = useAppStore((state) => state.activeShop)
    const isManager = activeShop?.role === "Manager"
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const { transactions = [], pagination, isLoading } = useStockTransactionsByShop(activeShop?.id || "", {
        search,
        page,
        limit: 20,
    })
    const { mutateAsync: reverseTransaction, isPending: isReversing } = useReverseStockTransaction()
    const [reverseTarget, setReverseTarget] = useState<string | null>(null)

    const handleReverse = async (id: string, reason: string) => {
        try {
            await reverseTransaction({ id, reason })
            setReverseTarget(null)
        } catch {
            // toast handled in the mutation
        }
    }
    console.log("transactions", transactions)
    // Sort transactions by date descending (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
    })

    const currency = useAppStore((state) => state.userCurrency) || "KES"

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading transactions...</p>
            </div>
        )
    }

    if (!sortedTransactions || sortedTransactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/5">
                <div className="bg-muted/20 p-4 rounded-full mb-4">
                    <ClipboardList className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">No recent transactions</p>
                <p className="text-sm text-muted-foreground/80 mt-1">
                    Stock transactions will appear here
                </p>
            </div>
        )
    }

    return (
        <>
        <div className="space-y-3">
            <div className="w-full sm:w-[300px]">
                <ListSearch
                    placeholder="Search item, type, reason..."
                    value={search}
                    onChange={(v) => { setSearch(v); setPage(1) }}
                />
            </div>
        <div className="overflow-x-auto pb-4">
            <div className="border rounded-lg min-w-[800px]">
                <div className="grid grid-cols-8 p-4 border-b bg-muted/40 font-medium text-sm text-muted-foreground">
                    <div>Date/Time</div>
                    <div>Item</div>
                    <div>Type</div>
                    <div className="text-right">Quantity</div>
                    <div>Reason</div>
                    <div>Reference</div>
                    <div>Created By</div>
                    <div className="text-right">Action</div>
                </div>
                <div className="divide-y max-h-[500px] overflow-y-auto">
                    {sortedTransactions.map((transaction) => (
                        <div
                            key={transaction.id}
                            className="grid grid-cols-8 p-4 items-center hover:bg-muted/50 transition-colors text-sm"
                        >
                            <div className="text-muted-foreground">
                                {transaction.created_at
                                    ? format(new Date(transaction.created_at), "MMM dd, HH:mm")
                                    : "N/A"}
                            </div>
                            <div className="font-medium text-foreground truncate" title={transaction.item_id}>
                                {transaction.item_name || transaction.item_id}
                            </div>
                            <div>
                                <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${transactionTypeColors[
                                        transaction.type as keyof typeof transactionTypeColors
                                    ] || "bg-gray-100 text-gray-700"
                                        }`}
                                >
                                    {transaction.type}
                                </span>
                                {transaction.reason === 'REVERSAL' && (
                                    <span className="ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                        Reversal
                                    </span>
                                )}
                            </div>
                            <div className="text-right font-semibold">
                                {transaction.quantity > 0 ? "+" : ""}
                                {formatQty(transaction.quantity)}
                            </div>
                            <div className="text-muted-foreground">{transaction.reason || "N/A"}</div>
                            <div className="text-muted-foreground truncate">
                                {transaction.reference_id || "-"}
                            </div>
                            <div className="text-muted-foreground truncate">
                                {transaction.created_by_name || transaction.created_by || "System"}
                            </div>
                            <div className="text-right">
                                {isManager && transaction.reason !== 'REVERSAL' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isReversing}
                                        onClick={() => setReverseTarget(transaction.id)}
                                    >
                                        Reverse
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <ListPagination pagination={pagination} onPageChange={setPage} />
            </div>
        </div>
        </div>
        <ReasonDialog
            open={reverseTarget !== null}
            onOpenChange={(open) => { if (!open) setReverseTarget(null) }}
            title="Reverse stock movement"
            description="The exact opposite movement will be recorded and linked to the original."
            confirmLabel="Reverse Movement"
            isSubmitting={isReversing}
            onSubmit={(reason) => { if (reverseTarget) handleReverse(reverseTarget, reason) }}
        />
        </>
    )
}
