"use client"

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

interface CloseShiftDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    cashAmount: string
    setCashAmount: (value: string) => void
    mpesaAmount: string
    setMpesaAmount: (value: string) => void
    onSubmit: () => void
    isLoading?: boolean
}

export function CloseShiftDialog({
    open,
    onOpenChange,
    cashAmount,
    setCashAmount,
    mpesaAmount,
    setMpesaAmount,
    onSubmit,
    isLoading,
}: CloseShiftDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Close Shift</DialogTitle>
                    <DialogDescription>
                        Enter the final balances for cash and M-Pesa to close your shift.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="cash">Final Cash Balance (KES)</Label>
                        <Input
                            id="cash"
                            type="number"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mpesa">Final M-Pesa Balance (KES)</Label>
                        <Input
                            id="mpesa"
                            type="number"
                            value={mpesaAmount}
                            onChange={(e) => setMpesaAmount(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                </div>
                <DialogFooter className="sm:justify-end gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={onSubmit} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                        {isLoading ? "Closing..." : "Confirm & Close"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
