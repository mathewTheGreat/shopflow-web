"use client"

import { useState } from "react"
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

interface CorrectOpeningFloatDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shiftId: string
    onSuccess?: () => void
}

export function CorrectOpeningFloatDialog({
    open,
    onOpenChange,
    shiftId,
    onSuccess,
}: CorrectOpeningFloatDialogProps) {
    const [cashAmount, setCashAmount] = useState("")
    const [mpesaAmount, setMpesaAmount] = useState("")
    const [reason, setReason] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const userInfo = useAppStore((state) => state.userInfo)
    const activeShift = useAppStore((state) => state.activeShift)

    const handleSubmit = async () => {
        if (!userInfo) return
        if (!reason.trim()) {
            toast.error("Enter a reason for correcting the opening float")
            return
        }

        const cash = Number(cashAmount)
        const mpesa = Number(mpesaAmount)
        if (!Number.isFinite(cash) || cash < 0
            || !Number.isFinite(mpesa) || mpesa < 0
            || (cash === 0 && mpesa === 0)) {
            toast.error("Enter at least one positive opening amount; amounts cannot be negative")
            return
        }

        setIsLoading(true)
        try {
            await shiftService.createLateOpeningFloat(shiftId, {
                cashAmount: cash,
                mpesaAmount: mpesa,
                reason: reason.trim(),
                recordedShiftId: activeShift?.id,
            })
            toast.success("Opening float correction recorded for manager review")
            setCashAmount("")
            setMpesaAmount("")
            setReason("")
            onOpenChange(false)
            onSuccess?.()
        } catch (error: any) {
            toast.error(`Failed to correct opening float: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Correct Opening Float</DialogTitle>
                    <DialogDescription>
                        Enter the verified cash and M-Pesa already present when this rejected shift began.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                        This records the opening balance against the rejected shift. It does not add money to the shop register. Enter 0 for a method with no opening float; at least one amount must be positive.
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="opening-float-cash">Opening Cash (KES)</Label>
                        <Input
                            id="opening-float-cash"
                            type="number"
                            min="0"
                            step="0.01"
                            value={cashAmount}
                            onChange={(event) => setCashAmount(event.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="opening-float-mpesa">Opening M-Pesa (KES)</Label>
                        <Input
                            id="opening-float-mpesa"
                            type="number"
                            min="0"
                            step="0.01"
                            value={mpesaAmount}
                            onChange={(event) => setMpesaAmount(event.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="opening-float-reason">Correction Reason</Label>
                        <Input
                            id="opening-float-reason"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="Explain how the opening balances were verified"
                        />
                    </div>
                </div>
                <DialogFooter className="sm:justify-end gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !reason.trim()}>
                        {isLoading ? "Saving..." : "Save Opening Float"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
