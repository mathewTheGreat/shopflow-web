"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppStore } from "@/store/use-app-store"
import { shiftService } from "@/services/shift.service"
import { toast } from "sonner"

interface CorrectReconciliationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shiftId: string
    onSuccess?: () => void
}

export function CorrectReconciliationDialog({
    open,
    onOpenChange,
    shiftId,
    onSuccess,
}: CorrectReconciliationDialogProps) {
    const [cashAmount, setCashAmount] = useState("")
    const [mpesaAmount, setMpesaAmount] = useState("")
    const [reason, setReason] = useState("")
    const [history, setHistory] = useState<Array<{
        id: string
        is_superseded: boolean
        actual_cash_amount: number
        actual_mpesa_amount?: number | null
        created_at?: string | null
        created_by_name: string | null
        notes?: string | null
    }>>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const userInfo = useAppStore((state) => state.userInfo)
    const activeShift = useAppStore((state) => state.activeShift)

    useEffect(() => {
        if (open && shiftId) {
            setIsFetching(true)
            Promise.all([
                shiftService.getShiftReconciliation(shiftId),
                shiftService.getShiftReconciliationHistory(shiftId),
            ])
                .then(([recon, revisions]) => {
                    if (recon) {
                        setCashAmount(String(recon.actual_cash_amount ?? ""))
                        setMpesaAmount(String(recon.actual_mpesa_amount ?? ""))
                    }
                    setHistory(revisions)
                })
                .catch((error) => toast.error(`Failed to load reconciliation: ${error.message}`))
                .finally(() => setIsFetching(false))
        }
    }, [open, shiftId])

    const handleSubmit = async () => {
        if (!userInfo) return
        if (!reason.trim()) {
            toast.error("Enter a reason for this correction")
            return
        }

        setIsLoading(true)
        try {
            await shiftService.amendReconciliation(shiftId, {
                actual_cash_amount: parseFloat(cashAmount) || 0,
                actual_mpesa_amount: parseFloat(mpesaAmount) || 0,
                reason: reason.trim(),
                userId: userInfo.id,
                recordedShiftId: activeShift?.id,
            })
            toast.success("Correction recorded for approval")
            onOpenChange(false)
            onSuccess?.()
        } catch (error: any) {
            toast.error(`Failed to update reconciliation: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Correct Reconciliation</DialogTitle>
                    <DialogDescription>
                        Update the actual cash and M-Pesa balances for this rejected shift.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md text-sm text-blue-800 dark:text-blue-200">
                        These corrections will be attributed to the original shift as late entries.
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cash">Actual Cash Balance (KES)</Label>
                        <Input
                            id="cash"
                            type="number"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                            placeholder="0.00"
                            disabled={isFetching}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mpesa">Actual M-Pesa Balance (KES)</Label>
                        <Input
                            id="mpesa"
                            type="number"
                            value={mpesaAmount}
                            onChange={(e) => setMpesaAmount(e.target.value)}
                            placeholder="0.00"
                            disabled={isFetching}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="correction-reason">Correction Reason</Label>
                        <Input
                            id="correction-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why these counts are being corrected"
                            disabled={isFetching}
                        />
                    </div>
                    {history.some((revision) => revision.is_superseded) && (
                        <div className="space-y-2 border-t pt-3">
                            <Label>Previous Reconciliation Versions</Label>
                            <div className="max-h-32 space-y-2 overflow-y-auto text-xs text-muted-foreground">
                                {history.filter((revision) => revision.is_superseded).map((revision) => (
                                    <div key={revision.id} className="rounded border p-2">
                                        <div>
                                            {revision.created_by_name || "Unknown user"} · {revision.created_at ? new Date(revision.created_at).toLocaleString() : "Unknown date"}
                                        </div>
                                        <div>
                                            Cash {revision.actual_cash_amount} / M-Pesa {revision.actual_mpesa_amount ?? 0}
                                        </div>
                                        <div>{revision.notes || "No reason recorded"}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter className="sm:justify-end gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || isFetching || !reason.trim()} className="bg-primary hover:bg-primary/90">
                        {isLoading ? "Saving..." : "Save Corrections"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
