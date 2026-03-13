"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useCloseProductionBatch } from "@/hooks/use-production"
import { useItems } from "@/hooks/use-items"
import { useAppStore } from "@/store/use-app-store"
import { ProductionBatch } from "@/types/production"
import { v4 as uuidv4 } from "uuid"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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

interface OutputItem {
    item_id: string
    quantity: string
}

export function CloseProductionDialog({
    open,
    onOpenChange,
    batch,
    onSuccess,
}: CloseProductionDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { mutateAsync: closeBatch } = useCloseProductionBatch()
    const { items, isLoading: itemsLoading } = useItems()
    const userInfo = useAppStore((state) => state.userInfo)
    const activeShop = useAppStore((state) => state.activeShop)
    const activeShift = useAppStore((state) => state.activeShift)

    const [notes, setNotes] = useState("")
    const [outputs, setOutputs] = useState<OutputItem[]>([
        { item_id: "", quantity: "" },
    ])

    useEffect(() => {
        if (open) {
            setNotes(batch?.notes || "")
            setOutputs([{ item_id: "", quantity: "" }])
        }
    }, [open, batch])

    const totalInputQuantity = batch?.total_input_quantity || 0

    const totalOutputQuantity = useMemo(() => {
        return outputs
            .filter((o) => o.quantity && parseFloat(o.quantity) > 0)
            .reduce((sum, o) => sum + parseFloat(o.quantity), 0)
    }, [outputs])

    const lossQuantity = totalInputQuantity - totalOutputQuantity

    const handleAddOutput = () => {
        setOutputs([...outputs, { item_id: "", quantity: "" }])
    }

    const handleRemoveOutput = (index: number) => {
        if (outputs.length > 1) {
            setOutputs(outputs.filter((_, i) => i !== index))
        }
    }

    const handleOutputChange = (index: number, field: keyof OutputItem, value: string) => {
        const newOutputs = [...outputs]
        newOutputs[index] = { ...newOutputs[index], [field]: value }
        setOutputs(newOutputs)
    }

    const validateForm = () => {
        if (!activeShift) {
            alert("You need an open shift to close production")
            return false
        }

        const validOutputs = outputs.filter(
            (output) => output.item_id && output.quantity && parseFloat(output.quantity) > 0
        )

        if (validOutputs.length === 0) {
            alert("Please add at least one output item")
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm() || !batch || !activeShift || !userInfo) return

        setIsSubmitting(true)

        try {
            const validOutputs = outputs.filter(
                (output) => output.item_id && output.quantity && parseFloat(output.quantity) > 0
            )

            const payload = {
                id: batch.id,
                data: {
                    finalized_shift_id: activeShift.id,
                    finalized_by: userInfo.id,
                    notes: notes || batch.notes,
                    outputs: validOutputs.map((output) => ({
                        item_id: output.item_id,
                        quantity: parseFloat(output.quantity),
                    })),
                },
            }

            console.log("Closing production batch:", payload)
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
                        Add output products and finalize this production batch.
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

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Output Items</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddOutput}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Output
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {outputs.map((output, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <div className="flex-1">
                                        <Select
                                            value={output.item_id}
                                            onValueChange={(value) =>
                                                handleOutputChange(index, "item_id", value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select item" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {itemsLoading ? (
                                                    <div className="p-2 text-sm text-muted-foreground">
                                                        Loading items...
                                                    </div>
                                                ) : (
                                                    items.map((item) => (
                                                        <SelectItem key={item.id} value={item.id}>
                                                            {item.name}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            placeholder="Qty"
                                            value={output.quantity}
                                            onChange={(e) =>
                                                handleOutputChange(index, "quantity", e.target.value)
                                            }
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveOutput(index)}
                                        disabled={outputs.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                        </div>
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
