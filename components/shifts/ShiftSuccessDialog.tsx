"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface ShiftSuccessDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    cashAmount: string
    mpesaAmount: string
}

export function ShiftSuccessDialog({
    open,
    onOpenChange,
    cashAmount,
    mpesaAmount,
}: ShiftSuccessDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Success</DialogTitle>
                </DialogHeader>
                <div className="text-base leading-relaxed py-4">
                    Shift successfully closed with KES {cashAmount} cash and KES {mpesaAmount} MPESA. Reconciliation
                    initiated.
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)} className="w-full bg-primary hover:bg-primary/90">
                        OK
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
