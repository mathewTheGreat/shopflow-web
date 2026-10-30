"use client"

import { useState } from "react"
import {
    ChevronLeft,
    Loader2,
    ArrowRightLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReasonDialog } from "@/components/ui/reason-dialog"
import { useShiftCashMovements, useReverseCashMovement } from "@/hooks/use-shift"
import { useAppStore } from "@/store/use-app-store"
import { cn } from "@/lib/utils"

interface CashMovementsManagerProps {
    onBack?: () => void
}

const movementTypeColors: Record<string, string> = {
    FLOAT_IN: "bg-primary/10 text-primary dark:bg-primary/20",
    PAY_OUT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    PAY_IN: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
}

const money = (value: number) => value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

export function CashMovementsManager({ onBack }: CashMovementsManagerProps) {
    const activeShop = useAppStore((state) => state.activeShop)
    const activeShift = useAppStore((state) => state.activeShift)
    const isManager = activeShop?.role === "Manager"
    const { movements = [], isLoading } = useShiftCashMovements(activeShift?.id)
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
        <div className="flex flex-col h-full bg-muted/30">
            <div className="bg-card border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-10 h-16">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                )}
                <div className="flex-1">
                    <h2 className="text-xl font-bold tracking-tight">Cash Movements</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
                <div className="max-w-5xl mx-auto space-y-6">
                    {!activeShift ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl bg-card/50 px-6">
                            <div className="bg-primary/5 p-6 rounded-full mb-6">
                                <ArrowRightLeft className="h-16 w-16 text-primary/20" />
                            </div>
                            <h3 className="text-2xl font-bold">No open shift</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                Open a shift to record and review cash movements.
                            </p>
                        </div>
                    ) : isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                            <p className="text-muted-foreground">Loading movements...</p>
                        </div>
                    ) : sorted.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl bg-card/50 px-6">
                            <div className="bg-primary/5 p-6 rounded-full mb-6">
                                <ArrowRightLeft className="h-16 w-16 text-primary/20" />
                            </div>
                            <h3 className="text-2xl font-bold">No cash movements</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                Movements recorded during this shift will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
                            <div className="grid grid-cols-12 p-4 border-b bg-muted/40 font-medium text-sm text-muted-foreground gap-4">
                                <div className="col-span-2">Type</div>
                                <div className="col-span-2 text-right">Amount</div>
                                <div className="col-span-2">Method</div>
                                <div className="col-span-3">Reason</div>
                                <div className="col-span-2">Date</div>
                                <div className="col-span-1 text-right">Action</div>
                            </div>
                            <div className="divide-y">
                                {sorted.map((m) => {
                                    const isReversalRow = !!m.reversal_of || m.is_reversal
                                    const isReversed = reversedIds.has(m.id)
                                    const isExpenseLeg = !!m.expense_id
                                    const canReverse = isManager && !isReversalRow && !isReversed && !isExpenseLeg
                                    return (
                                        <div key={m.id} className="grid grid-cols-12 p-4 items-center hover:bg-muted/50 transition-colors text-sm gap-4">
                                            <div className="col-span-2 flex flex-wrap gap-1">
                                                <span className={cn(
                                                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                                    movementTypeColors[m.type] || "bg-gray-100 text-gray-700"
                                                )}>
                                                    {m.type}
                                                </span>
                                                {isReversalRow && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                        Reversal
                                                    </span>
                                                )}
                                                {isReversed && !isReversalRow && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                        Reversed
                                                    </span>
                                                )}
                                            </div>
                                            <div className={cn(
                                                "col-span-2 text-right font-bold tabular-nums text-xs sm:text-sm whitespace-nowrap",
                                                m.type === "PAY_OUT" ? "text-red-600" : "text-emerald-600"
                                            )}>
                                                {m.type === "PAY_OUT" ? "-" : "+"}KES {money(m.amount)}
                                            </div>
                                            <div className="col-span-2 text-muted-foreground text-xs uppercase font-semibold">
                                                {m.payment_method}
                                            </div>
                                            <div className="col-span-3 text-muted-foreground truncate text-xs" title={m.reason || ""}>
                                                {m.reason || "-"}
                                            </div>
                                            <div className="col-span-2 text-muted-foreground text-xs">
                                                {m.created_at
                                                    ? new Date(m.created_at).toLocaleString("en-US", {
                                                        month: "short", day: "numeric", hour: "numeric",
                                                        minute: "numeric", hour12: true,
                                                    })
                                                    : "-"}
                                            </div>
                                            <div className="col-span-1 text-right">
                                                {canReverse ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={isReversing}
                                                        title={m.float_transaction_id ? "Reverses the whole float group" : "Reverse this movement"}
                                                        onClick={() => setReverseTarget({ id: m.id, isFloat: !!m.float_transaction_id })}
                                                    >
                                                        Reverse
                                                    </Button>
                                                ) : isExpenseLeg && !isReversalRow ? (
                                                    <span className="text-[10px] text-muted-foreground" title="Reverse through the expense">via expense</span>
                                                ) : null}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
        </div>
    )
}
