"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useCloseProductionBatch } from "@/hooks/use-production"
import { useAppStore } from "@/store/use-app-store"
import { ProductionBatch } from "@/types/production"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface CloseProductionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    batch: ProductionBatch | null
    onSuccess?: () => void
}

export function CloseProductionDialog({
    open,
    onOpenChange,
    batch,
    onSuccess,
}: CloseProductionDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { mutateAsync: closeBatch } = useCloseProductionBatch()
    const userInfo = useAppStore((state) => state.userInfo)
    const activeShift = useAppStore((state) => state.activeShift)

    const [notes, setNotes] = useState("")

    useEffect(() => {
        if (open && batch) {
            setNotes(batch.notes || "")
        }
    }, [open, batch])

    const totalInputQuantity = batch?.total_input_quantity || 0
    const totalOutputQuantity = batch?.total_output_quantity || 0
    const lossQuantity = totalInputQuantity - totalOutputQuantity

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!batch || !activeShift || !userInfo) return

        setIsSubmitting(true)

        try {
            const payload = {
                id: batch.id,
                data: {
                    finalized_shift_id: activeShift.id,
                    finalized_by: userInfo.id,
                    notes: notes || batch.notes,
                    outputs: [],
                },
            }

            await closeBatch(payload)

            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            console.error("Failed to close batch:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!batch) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Close Production Batch</DialogTitle>
                    <DialogDescription>
                        {batch.status === 'IN_PROGRESS'
                            ? "This batch has partial outputs. You can close to finalize."
                            : "Finalize this production batch."}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-3">Batch Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Process:</div>
                        <div>{batch.process_type}</div>
                        <div className="text-muted-foreground">Total Input:</div>
                        <div className="font-medium">{totalInputQuantity}</div>
                        <div className="text-muted-foreground">Total Output:</div>
                        <div className="font-medium">{totalOutputQuantity || "-"}</div>
                        <div className="text-muted-foreground">Loss:</div>
                        <div className={lossQuantity > 0 ? "text-red-500 font-medium" : ""}>
                            {lossQuantity > 0 ? lossQuantity : "-"}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input
                            id="notes"
                            placeholder="Override or add notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {lossQuantity > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                            Warning: {lossQuantity} units will be recorded as loss
                        </div>
                    )}

                    {!activeShift && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                            You need an open shift to close production.
                        </div>
                    )}

                    <DialogFooter className="sm:justify-end gap-2">
                        <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !activeShift}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Closing...
                                </>
                            ) : (
                                "Close Batch"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
