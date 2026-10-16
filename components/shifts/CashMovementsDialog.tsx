"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ReasonDialog } from "@/components/ui/reason-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useShiftCashMovements, useReverseCashMovement } from "@/hooks/use-shift"
import { useAppStore } from "@/store/use-app-store"
import { Loader2 } from "lucide-react"

interface CashMovementsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shiftId: string | undefined
}

const movementTypeColors: Record<string, string> = {
    FLOAT_IN: "bg-primary/10 text-primary dark:bg-primary/20",
    PAY_OUT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    PAY_IN: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
}

export function CashMovementsDialog({ open, onOpenChange, shiftId }: CashMovementsDialogProps) {
    const activeShop = useAppStore((state) => state.activeShop)
    const isManager = activeShop?.role === "Manager"
    const { movements = [], isLoading } = useShiftCashMovements(open ? shiftId : undefined)
    const { mutateAsync: reverseMovement, isPending: isReversing } = useReverseCashMovement()
    const [reverseTarget, setReverseTarget] = useState<{ id: string; isFloat: boolean } | null>(null)

    const reversedIds = new Set(
        movements.filter((m) => m.reversal_of).map((m) => String(m.reversal_of))
    )

    const sorted = [...movements].sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0
        const db = b.created_at ? new Date(b.created_at).getTime() : 0
        return db - da
    })

    const handleReverse = async (id: string, reason: string) => {
        try {
            await reverseMovement({ id, reason })
            setReverseTarget(null)
        } catch {
            // toast handled in the mutation
        }
    }

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Shift Cash Movements</DialogTitle>
                    <DialogDescription>
                        Append-only ledger. Expense-linked movements reverse through their expense;
                        float legs reverse as a whole group.
                    </DialogDescription>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : sorted.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">No cash movements recorded.</p>
                ) : (
                    <div className="divide-y border rounded-lg">
                        {sorted.map((m) => {
                            const isReversalRow = !!m.reversal_of || m.is_reversal
                            const isReversed = reversedIds.has(m.id)
                            const isExpenseLeg = !!m.expense_id
                            const canReverse = isManager && !isReversalRow && !isReversed && !isExpenseLeg
                            return (
                                <div key={m.id} className="grid grid-cols-12 p-3 items-center gap-2 text-sm">
                                    <div className="col-span-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${movementTypeColors[m.type] || "bg-gray-100 text-gray-700"}`}>
                                            {m.type}
                                        </span>
                                        {isReversalRow && (
                                            <span className="ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                Reversal
                                            </span>
                                        )}
                                        {isReversed && !isReversalRow && (
                                            <span className="ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                Reversed
                                            </span>
                                        )}
                                    </div>
                                    <div className="col-span-2 text-right font-bold">
                                        {m.type === "PAY_OUT" ? "-" : "+"}KES {m.amount.toLocaleString()}
                                    </div>
                                    <div className="col-span-2 text-muted-foreground text-xs uppercase">
                                        {m.payment_method}
                                    </div>
                                    <div className="col-span-3 text-muted-foreground truncate text-xs" title={m.reason || ""}>
                                        {m.reason || "-"}
                                    </div>
                                    <div className="col-span-2 text-right">
                                        {canReverse && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={isReversing}
                                                title={m.float_transaction_id ? "Reverses the whole float group" : "Reverse this movement"}
                                                onClick={() => setReverseTarget({ id: m.id, isFloat: !!m.float_transaction_id })}
                                            >
                                                Reverse
                                            </Button>
                                        )}
                                        {isExpenseLeg && !isReversalRow && (
                                            <span className="text-xs text-muted-foreground" title="Reverse through the expense">via expense</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
        <ReasonDialog
            open={reverseTarget !== null}
            onOpenChange={(open) => { if (!open) setReverseTarget(null) }}
            title={reverseTarget?.isFloat ? "Reverse float transfer" : "Reverse cash movement"}
            description={reverseTarget?.isFloat
                ? "The WHOLE float group reverses together as linked entries."
                : "The exact opposite movement will be recorded and linked to the original."}
            confirmLabel="Reverse"
            isSubmitting={isReversing}
                onSubmit={(reason) => { if (reverseTarget) handleReverse(reverseTarget.id, reason) }}
        />
        </>
    )
}
