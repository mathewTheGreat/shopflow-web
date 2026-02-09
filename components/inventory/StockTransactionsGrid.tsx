"use client"

import { Loader2, ClipboardList } from "lucide-react"
import { useStockTransactionsByShop } from "@/hooks/use-stock-transactions"
import { useAppStore } from "@/store/use-app-store"
import { format } from "date-fns"

const transactionTypeColors = {
    IN: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    OUT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    TRANSFER_IN: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
    TRANSFER_OUT: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    ADJUSTMENT: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
}

export function StockTransactionsGrid() {
    const activeShop = useAppStore((state) => state.activeShop)
    const { data: transactions = [], isLoading } = useStockTransactionsByShop(activeShop?.id || "", 50)

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
        <div className="overflow-x-auto pb-4">
            <div className="border rounded-lg min-w-[700px]">
                <div className="grid grid-cols-7 p-4 border-b bg-muted/40 font-medium text-sm text-muted-foreground">
                    <div>Date/Time</div>
                    <div>Item</div>
                    <div>Type</div>
                    <div className="text-right">Quantity</div>
                    <div>Reason</div>
                    <div>Reference</div>
                    <div>Created By</div>
                </div>
                <div className="divide-y max-h-[500px] overflow-y-auto">
                    {sortedTransactions.map((transaction) => (
                        <div
                            key={transaction.id}
                            className="grid grid-cols-7 p-4 items-center hover:bg-muted/50 transition-colors text-sm"
                        >
                            <div className="text-muted-foreground">
                                {transaction.created_at
                                    ? format(new Date(transaction.created_at), "MMM dd, HH:mm")
                                    : "N/A"}
                            </div>
                            <div className="font-medium text-foreground truncate">
                                {transaction.item_id}
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
                            </div>
                            <div className="text-right font-semibold">
                                {transaction.quantity > 0 ? "+" : ""}
                                {transaction.quantity}
                            </div>
                            <div className="text-muted-foreground">{transaction.reason || "N/A"}</div>
                            <div className="text-muted-foreground truncate">
                                {transaction.reference_id || "-"}
                            </div>
                            <div className="text-muted-foreground truncate">
                                {transaction.created_by || "System"}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
