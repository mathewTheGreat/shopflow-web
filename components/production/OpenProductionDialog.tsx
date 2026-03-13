"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useOpenProductionBatch } from "@/hooks/use-production"
import { useItems } from "@/hooks/use-items"
import { useAppStore } from "@/store/use-app-store"
import { ProductionProcessType } from "@/types/production"
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

interface OpenProductionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

interface InputItem {
    item_id: string
    quantity: string
}

export function OpenProductionDialog({ open, onOpenChange, onSuccess }: OpenProductionDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { mutateAsync: openBatch } = useOpenProductionBatch()
    const { items, isLoading: itemsLoading } = useItems()
    const userInfo = useAppStore((state) => state.userInfo)
    const activeShop = useAppStore((state) => state.activeShop)
    const activeShift = useAppStore((state) => state.activeShift)

    const [formData, setFormData] = useState({
        process_type: "PASTEURIZATION" as ProductionProcessType,
        notes: "",
    })

    const [inputs, setInputs] = useState<InputItem[]>([
        { item_id: "", quantity: "" },
    ])

    useEffect(() => {
        if (open) {
            setFormData({
                process_type: "PASTEURIZATION",
                notes: "",
            })
            setInputs([{ item_id: "", quantity: "" }])
        }
    }, [open])

    const handleAddInput = () => {
        setInputs([...inputs, { item_id: "", quantity: "" }])
    }

    const handleRemoveInput = (index: number) => {
        if (inputs.length > 1) {
            setInputs(inputs.filter((_, i) => i !== index))
        }
    }

    const handleInputChange = (index: number, field: keyof InputItem, value: string) => {
        const newInputs = [...inputs]
        newInputs[index] = { ...newInputs[index], [field]: value }
        setInputs(newInputs)
    }

    const validateForm = () => {
        if (!activeShift) {
            alert("You need an open shift to start production")
            return false
        }

        const validInputs = inputs.filter(
            (input) => input.item_id && input.quantity && parseFloat(input.quantity) > 0
        )

        if (validInputs.length === 0) {
            alert("Please add at least one input item")
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return
        if (!activeShop || !userInfo || !activeShift) return

        setIsSubmitting(true)

        try {
            const validInputs = inputs.filter(
                (input) => input.item_id && input.quantity && parseFloat(input.quantity) > 0
            )

            const payload = {
                id: uuidv4(),
                shop_id: activeShop.id,
                start_shift_id: activeShift.id,
                created_by: userInfo.id,
                process_type: formData.process_type,
                notes: formData.notes || undefined,
                inputs: validInputs.map((input) => ({
                    item_id: input.item_id,
                    quantity: parseFloat(input.quantity),
                })),
            }

            console.log("Submitting production batch:", payload)
            await openBatch(payload)

            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            console.error("Failed to open batch:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Open Production Batch</DialogTitle>
                    <DialogDescription>
                        Add input materials to start a new production batch.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="process_type">Process Type</Label>
                        <Select
                            value={formData.process_type}
                            onValueChange={(value: ProductionProcessType) =>
                                setFormData({ ...formData, process_type: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select process type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PASTEURIZATION">Pasteurization</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input
                            id="notes"
                            placeholder="Add notes about this batch"
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData({ ...formData, notes: e.target.value })
                            }
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Input Items</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddInput}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Input
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-[250px] overflow-y-auto">
                            {inputs.map((input, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <div className="flex-1">
                                        <Select
                                            value={input.item_id}
                                            onValueChange={(value) =>
                                                handleInputChange(index, "item_id", value)
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
                                            value={input.quantity}
                                            onChange={(e) =>
                                                handleInputChange(index, "quantity", e.target.value)
                                            }
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveInput(index)}
                                        disabled={inputs.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {!activeShift && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                            You need an open shift to start production. Please open a shift first.
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
                                    Opening...
                                </>
                            ) : (
                                "Open Batch"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
