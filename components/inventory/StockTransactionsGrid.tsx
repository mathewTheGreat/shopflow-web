"use client"

import { useEffect, useState } from "react"
import { Loader2, ClipboardList } from "lucide-react"
import {
    useStockTransactionsByShop,
    useReverseStockTransaction,
    usePurchaseCorrectionContext,
    useCorrectPurchaseForReport,
} from "@/hooks/use-stock-transactions"
import { useItems } from "@/hooks/use-items"
import { useAppStore } from "@/store/use-app-store"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
    const activeRole = String(activeShop?.role ?? "").toLowerCase()
    const isManager = activeRole === "manager" || activeRole === "admin"
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const { transactions = [], pagination, isLoading } = useStockTransactionsByShop(activeShop?.id || "", {
        search,
        page,
        limit: 20,
    })
    const { mutateAsync: reverseTransaction, isPending: isReversing } = useReverseStockTransaction()
    const { mutateAsync: correctPurchase, isPending: isCorrecting } = useCorrectPurchaseForReport()
    const {
        items = [],
        isLoading: isLoadingItems,
        error: itemsError,
    } = useItems({ limit: 200 })
    const [reverseTarget, setReverseTarget] = useState<string | null>(null)
    const [correctionTarget, setCorrectionTarget] = useState<{
        id: string
        itemId: string
        quantity: number
    } | null>(null)
    const [correctedItemId, setCorrectedItemId] = useState("")
    const [correctedQuantity, setCorrectedQuantity] = useState("")
    const [correctionReason, setCorrectionReason] = useState("")
    const [selectedAdjustmentIds, setSelectedAdjustmentIds] = useState<string[]>([])
    const [initializedCorrectionId, setInitializedCorrectionId] = useState<string | null>(null)
    const correctionContextQuery = usePurchaseCorrectionContext(correctionTarget?.id ?? null, correctedItemId)
    const correctionContext = correctionContextQuery.data

    useEffect(() => {
        if (!correctionTarget || !correctionContext || initializedCorrectionId === correctionTarget.id) return
        if (correctionContext.currentCorrection) {
            setCorrectedItemId(correctionContext.currentCorrection.corrected_item_id)
            setCorrectedQuantity(String(correctionContext.currentCorrection.corrected_quantity))
            setSelectedAdjustmentIds(
                correctionContext.currentCorrection.related_adjustment_transaction_ids ?? []
            )
        }
        setInitializedCorrectionId(correctionTarget.id)
    }, [correctionContext, correctionTarget, initializedCorrectionId])

    const handleReverse = async (id: string, reason: string) => {
        try {
            await reverseTransaction({ id, reason })
            setReverseTarget(null)
        } catch {
            // toast handled in the mutation
        }
    }

    // Sort transactions by date descending (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
    })

    const openCorrection = (transaction: (typeof sortedTransactions)[number]) => {
        setCorrectionTarget({
            id: transaction.id,
            itemId: transaction.item_id,
            quantity: Number(transaction.quantity),
        })
        setCorrectedItemId(transaction.item_id)
        setCorrectedQuantity(String(transaction.quantity))
        setCorrectionReason("")
        setSelectedAdjustmentIds([])
        setInitializedCorrectionId(null)
    }

    const closeCorrection = (open: boolean) => {
        if (open || isCorrecting) return
        setCorrectionTarget(null)
        setCorrectedItemId("")
        setCorrectedQuantity("")
        setCorrectionReason("")
        setSelectedAdjustmentIds([])
        setInitializedCorrectionId(null)
    }

    const handleCorrectPurchase = async () => {
        if (!correctionTarget) return
        try {
            await correctPurchase({
                id: correctionTarget.id,
                correctedItemId,
                quantity: Number(correctedQuantity),
                reason: correctionReason.trim(),
                relatedAdjustmentTransactionIds: selectedAdjustmentIds,
            })
            closeCorrection(false)
        } catch {
            // The mutation surfaces the server error via a toast.
        }
    }

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
            <div className="border rounded-lg min-w-[1100px]">
                <div className="grid grid-cols-[145px_minmax(150px,1.3fr)_110px_95px_minmax(140px,1fr)_minmax(140px,1fr)_minmax(130px,1fr)_170px] p-4 border-b bg-muted/40 font-medium text-sm text-muted-foreground">
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
                            className="grid grid-cols-[145px_minmax(150px,1.3fr)_110px_95px_minmax(140px,1fr)_minmax(140px,1fr)_minmax(130px,1fr)_170px] p-4 items-center hover:bg-muted/50 transition-colors text-sm"
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
                            <div className="flex flex-col items-end gap-2">
                                {isManager && transaction.type === "IN" && transaction.reason?.toUpperCase() === "PURCHASE" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full max-w-[150px]"
                                        onClick={() => openCorrection(transaction)}
                                    >
                                        Correct report
                                    </Button>
                                )}
                                {isManager && transaction.reason !== 'REVERSAL' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full max-w-[150px]"
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
        <Dialog open={correctionTarget !== null} onOpenChange={closeCorrection}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Correct purchase on original shift</DialogTitle>
                    <DialogDescription>
                        This records a report-only correction. It will revise the responsible shift&apos;s report,
                        keep the original stocktake counts and audit history, and will not change current stock
                        or later shifts&apos; reports.
                    </DialogDescription>
                </DialogHeader>
                {correctionTarget && (
                    <div className="space-y-4">
                        {correctionContextQuery.isLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading related shift records...
                            </div>
                        ) : correctionContextQuery.error ? (
                            <p role="alert" className="text-sm text-destructive">
                                Could not load correction context: {correctionContextQuery.error.message}
                            </p>
                        ) : (
                            <>
                                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                                    <p>
                                        Original: {correctionContext?.transaction.item_name} ·{" "}
                                        {formatQty(Number(correctionContext?.transaction.quantity ?? correctionTarget.quantity))}
                                        {correctionContext?.transaction.supplier_name
                                            ? ` from ${correctionContext.transaction.supplier_name}`
                                            : ""}
                                    </p>
                                    <p className="text-muted-foreground">
                                        Responsible shift: {correctionContext?.shift.id}
                                        {correctionContext?.shift.closing_status
                                            ? ` · ${correctionContext.shift.closing_status}`
                                            : ""}
                                    </p>
                                </div>
                                {correctionContext?.currentCorrection && (
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        An active correction already exists. Saving will supersede it and add a new
                                        audited revision.
                                    </p>
                                )}
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="correction-item">Correct item</Label>
                                        {itemsError && (
                                            <p role="alert" className="text-sm text-destructive">
                                                Could not load items: {itemsError.message}
                                            </p>
                                        )}
                                        <select
                                            id="correction-item"
                                            value={correctedItemId}
                                            disabled={isLoadingItems}
                                            onChange={(event) => {
                                                setCorrectedItemId(event.target.value)
                                                setSelectedAdjustmentIds([])
                                            }}
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="">Select an item</option>
                                            {items.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name} ({item.unit_of_measure})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="correction-quantity">Correct quantity</Label>
                                        <Input
                                            id="correction-quantity"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={correctedQuantity}
                                            onChange={(event) => setCorrectedQuantity(event.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="rounded-md border p-3">
                                    <h4 className="mb-2 text-sm font-medium">
                                        Related original-shift records
                                    </h4>
                                    <p className="mb-2 text-xs text-muted-foreground">
                                        These records will be considered together for the report projection; saved
                                        stocktake counts are not edited. Select only the automatic adjustments
                                        produced by this mistaken purchase that should be removed from its shift report.
                                    </p>
                                    <ul className="space-y-1 text-sm">
                                        {(correctionContext?.stockTakes ?? []).map((take) => {
                                            const item = items.find((entry) => entry.id === take.item_id)
                                            return (
                                                <li key={take.id}>
                                                    Stocktake — {item?.name ?? take.item_id}: counted{" "}
                                                    {formatQty(Number(take.counted_qty))}, variance{" "}
                                                    {formatQty(Number(take.variance))}
                                                </li>
                                            )
                                        })}
                                        {(correctionContext?.relatedAdjustments ?? []).map((adjustment) => {
                                            const item = items.find((entry) => entry.id === adjustment.item_id)
                                            return (
                                                <li key={adjustment.id} className="flex items-start gap-2">
                                                    <input
                                                        id={`correction-adjustment-${adjustment.id}`}
                                                        type="checkbox"
                                                        checked={selectedAdjustmentIds.includes(adjustment.id)}
                                                        onChange={(event) => setSelectedAdjustmentIds((selected) => (
                                                            event.target.checked
                                                                ? [...selected, adjustment.id]
                                                                : selected.filter((id) => id !== adjustment.id)
                                                        ))}
                                                        className="mt-1"
                                                    />
                                                    <label htmlFor={`correction-adjustment-${adjustment.id}`}>
                                                        Include adjustment correction — {item?.name ?? adjustment.item_id}:{" "}
                                                        {formatQty(Number(adjustment.quantity))}
                                                    </label>
                                                </li>
                                            )
                                        })}
                                        {!correctionContext?.stockTakes.length && !correctionContext?.relatedAdjustments.length && (
                                            <li className="text-muted-foreground">No matching stocktakes or auto-adjustments found.</li>
                                        )}
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="correction-reason">Audit reason (required)</Label>
                                    <textarea
                                        id="correction-reason"
                                        value={correctionReason}
                                        onChange={(event) => setCorrectionReason(event.target.value)}
                                        maxLength={2000}
                                        rows={3}
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="Explain what was recorded incorrectly and the evidence for the correction."
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => closeCorrection(false)} disabled={isCorrecting}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={
                            isCorrecting
                            || correctionContextQuery.isLoading
                            || !!correctionContextQuery.error
                            || !!itemsError
                            || !correctedItemId
                            || !Number.isFinite(Number(correctedQuantity))
                            || Number(correctedQuantity) <= 0
                            || !correctionReason.trim()
                        }
                        onClick={handleCorrectPurchase}
                    >
                        {isCorrecting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save report correction
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}
