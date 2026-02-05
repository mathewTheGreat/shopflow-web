"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Loader2, PackageMinus } from "lucide-react"
import { useCreateStockTransaction } from "@/hooks/use-stock-transactions"
import { useItems } from "@/hooks/use-items"
import { useAppStore } from "@/store/use-app-store"
import { Card, CardContent } from "../ui/card"
import { v4 as uuidv4 } from "uuid"

interface StockOutDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

type StockOutReason = "DAMAGE" | "LOSS" | "ADJUSTMENT"

export function StockOutDialog({ open, onOpenChange, onSuccess }: StockOutDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { mutateAsync: createTransaction } = useCreateStockTransaction()
    const { items, isLoading: itemsLoading } = useItems()
    const userInfo = useAppStore((state) => state.userInfo)
    const activeShop = useAppStore((state) => state.activeShop)
    const activeShift = useAppStore((state) => state.activeShift)

    // Form state
    const [formData, setFormData] = useState({
        item_id: "",
        quantity: "",
        reason: "DAMAGE" as StockOutReason,
        reference_id: "",
        notes: "",
    })

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setFormData({
                item_id: "",
                quantity: "",
                reason: "DAMAGE",
                reference_id: "",
                notes: "",
            })
        }
    }, [open])

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleReasonChange = (reason: StockOutReason) => {
        setFormData((prev) => ({ ...prev, reason }))
    }

    const validateForm = () => {
        if (!formData.item_id) {
            alert("Please select an item")
            return false
        }

        if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
            alert("Please enter a valid quantity greater than 0")
            return false
        }

        if (!activeShop?.id) {
            alert("No shop selected. Please select a shop first.")
            return false
        }

        if (!activeShift?.id) {
            alert("No active shift. Please open a shift first.")
            return false
        }

        return true
    }

    const handleSubmit = async () => {
        if (!validateForm()) return

        setIsSubmitting(true)

        try {
            // 1. Create the transaction record (Type: OUT)
            const transactionData = {
                id: uuidv4(),
                type: "OUT",
                item_id: formData.item_id,
                shop_id: activeShop!.id,
                quantity: parseFloat(formData.quantity), // Stored as positive value
                reason: formData.reason,
                reference_id: formData.reference_id || undefined,
                notes: formData.notes || undefined,
                shift_id: activeShift!.id,
                created_by: userInfo?.id || "system",
                created_at: new Date().toISOString(),
            }

            await createTransaction(transactionData)

            // 2. Update the stock level (Decrease quantity)
            const { stockLevelService } = await import("@/services/stock-level.service")

            try {
                // Try to get existing stock level
                const currentLevel = await stockLevelService.getStockLevelByItemAndShop(
                    formData.item_id,
                    activeShop!.id
                )

                // If exists, update (SUBTRACT)
                if (currentLevel) {
                    const newQuantity = (currentLevel.quantity || 0) - parseFloat(formData.quantity)
                    await stockLevelService.updateStockLevel(
                        formData.item_id,
                        activeShop!.id,
                        { quantity: newQuantity }
                    )
                } else {
                    // Logic: If trying to stock OUT but no level exists, technically it's 0 - qty.
                    // Depending on business logic, we might block or allow negative. 
                    // Based on requirements, we allow negative.
                    await stockLevelService.setStockLevel({
                        item_id: formData.item_id,
                        shop_id: activeShop!.id,
                        quantity: -parseFloat(formData.quantity),
                    })
                }
            } catch (error) {
                // If fetching fails, create new with negative quantity
                await stockLevelService.setStockLevel({
                    item_id: formData.item_id,
                    shop_id: activeShop!.id,
                    quantity: -parseFloat(formData.quantity),
                })
            }

            // Close dialog and trigger success callback
            onOpenChange(false)
            if (onSuccess) {
                onSuccess()
            }
        } catch (error: any) {
            console.error("Error processing stock-out:", error)
            alert(error.message || "Failed to process stock-out. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        onOpenChange(false)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="h-[100vh] w-full p-0 gap-0 overflow-hidden flex flex-col max-w-none"
            >
                {/* Header */}
                <div className="sticky top-0 bg-card z-10 border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold">Stock Out</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Record stock removal for damage, loss, or adjustments
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto min-h-0 bg-muted/30">
                    <div className="p-6 md:p-8 lg:p-12 space-y-6">
                        <div className="max-w-5xl mx-auto">
                            <Card>
                                <CardContent className="p-6 md:p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Reason Selection */}
                                        <div className="md:col-span-2">
                                            <Label className="text-base mb-3 block">
                                                Reason <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <Button
                                                    type="button"
                                                    variant={formData.reason === "DAMAGE" ? "default" : "outline"}
                                                    className="h-14 text-base"
                                                    onClick={() => handleReasonChange("DAMAGE")}
                                                >
                                                    Damage
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={formData.reason === "LOSS" ? "default" : "outline"}
                                                    className="h-14 text-base"
                                                    onClick={() => handleReasonChange("LOSS")}
                                                >
                                                    Loss
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={formData.reason === "ADJUSTMENT" ? "default" : "outline"}
                                                    className="h-14 text-base"
                                                    onClick={() => handleReasonChange("ADJUSTMENT")}
                                                >
                                                    Adjustment
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Item Selection */}
                                        <div className="md:col-span-2">
                                            <Label htmlFor="item_id" className="text-base mb-2 block">
                                                Item <span className="text-destructive">*</span>
                                            </Label>
                                            {itemsLoading ? (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Loading items...
                                                </div>
                                            ) : (
                                                <select
                                                    id="item_id"
                                                    value={formData.item_id}
                                                    onChange={(e) => handleInputChange("item_id", e.target.value)}
                                                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="">Select an item</option>
                                                    {items.map((item) => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.name} ({item.unit_of_measure})
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        {/* Quantity */}
                                        <div>
                                            <Label htmlFor="quantity" className="text-base mb-2 block">
                                                Quantity <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="quantity"
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                placeholder="0.00"
                                                value={formData.quantity}
                                                onChange={(e) => handleInputChange("quantity", e.target.value)}
                                                className="h-12 text-base"
                                            />
                                        </div>

                                        {/* Reference ID */}
                                        <div>
                                            <Label htmlFor="reference_id" className="text-base mb-2 block">
                                                Reference ID (Optional)
                                            </Label>
                                            <Input
                                                id="reference_id"
                                                placeholder="Damage report, etc."
                                                value={formData.reference_id}
                                                onChange={(e) => handleInputChange("reference_id", e.target.value)}
                                                className="h-12 text-base"
                                            />
                                        </div>

                                        {/* Notes */}
                                        <div className="md:col-span-2">
                                            <Label htmlFor="notes" className="text-base mb-2 block">
                                                Notes (Optional)
                                            </Label>
                                            <textarea
                                                id="notes"
                                                placeholder="Explain why stock is being removed..."
                                                value={formData.notes}
                                                onChange={(e) => handleInputChange("notes", e.target.value)}
                                                rows={3}
                                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                                        <Button variant="outline" onClick={handleClose} className="h-12 px-6">
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            variant="destructive"
                                            className="h-12 px-6"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Recording...
                                                </>
                                            ) : (
                                                <>
                                                    <PackageMinus className="h-4 w-4 mr-2" />
                                                    Record Stock Out
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
