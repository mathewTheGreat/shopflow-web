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
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const userInfo = useAppStore((state) => state.userInfo)

    useEffect(() => {
        if (open && shiftId) {
            setIsFetching(true)
            shiftService.getShiftReconciliation(shiftId)
                .then((recon) => {
                    if (recon) {
                        setCashAmount(String(recon.actual_cash_amount ?? ""))
                        setMpesaAmount(String(recon.actual_mpesa_amount ?? ""))
                    }
                })
                .catch(() => {
                    setCashAmount("")
                    setMpesaAmount("")
                })
                .finally(() => setIsFetching(false))
        }
    }, [open, shiftId])

    const handleSubmit = async () => {
        if (!userInfo) return

        setIsLoading(true)
        try {
            await shiftService.amendReconciliation(shiftId, {
                actual_cash_amount: parseFloat(cashAmount) || 0,
                actual_mpesa_amount: parseFloat(mpesaAmount) || 0,
            })
            toast.success("Reconciliation amounts updated")
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
                </div>
                <DialogFooter className="sm:justify-end gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || isFetching} className="bg-primary hover:bg-primary/90">
                        {isLoading ? "Saving..." : "Save Corrections"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
