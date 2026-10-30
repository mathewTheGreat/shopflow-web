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

interface OpenShiftDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    cashAmount: string
    setCashAmount: (value: string) => void
    mpesaAmount: string
    setMpesaAmount: (value: string) => void
    onSubmit: () => void
    isLoading?: boolean
}

export function OpenShiftDialog({
    open,
    onOpenChange,
    cashAmount,
    setCashAmount,
    mpesaAmount,
    setMpesaAmount,
    onSubmit,
    isLoading,
}: OpenShiftDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Open Shift</DialogTitle>
                    <DialogDescription>
                        Enter the cash and M-Pesa already in the register at shift start. These
                        become this shift's opening balances; they are not added to the register again.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="open-cash">Opening Cash (KES)</Label>
                        <Input
                            id="open-cash"
                            type="number"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="open-mpesa">Opening M-Pesa (KES)</Label>
                        <Input
                            id="open-mpesa"
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
                    <Button onClick={onSubmit} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                        {isLoading ? "Opening..." : "Open Shift"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
