"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Loader2, Package } from "lucide-react"
import { useCreateStockTransaction } from "@/hooks/use-stock-transactions"
import { useItems } from "@/hooks/use-items"
import { useSuppliers } from "@/hooks/use-supplier"
import { useAppStore } from "@/store/use-app-store"
import { Card, CardContent } from "../ui/card"
import { v4 as uuidv4 } from "uuid"

interface StockInDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

type StockInReason = "PURCHASE" | "ADJUSTMENT"

export function StockInDialog({ open, onOpenChange, onSuccess }: StockInDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { mutateAsync: createTransaction } = useCreateStockTransaction()
    const { items, isLoading: itemsLoading } = useItems()
    const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers()
    const userInfo = useAppStore((state) => state.userInfo)
    const activeShop = useAppStore((state) => state.activeShop)
    const activeShift = useAppStore((state) => state.activeShift)

    // Form state
    const [formData, setFormData] = useState({
        item_id: "",
        quantity: "",
        reason: "PURCHASE" as StockInReason,
        supplier_id: "",
        reference_id: "",
        notes: "",
    })

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setFormData({
                item_id: "",
                quantity: "",
                reason: "PURCHASE",
                supplier_id: "",
                reference_id: "",
                notes: "",
            })
        }
    }, [open])

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleReasonChange = (reason: StockInReason) => {
        setFormData((prev) => ({
            ...prev,
            reason,
            // Clear supplier if switching to ADJUSTMENT
            supplier_id: reason === "ADJUSTMENT" ? "" : prev.supplier_id,
        }))
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

        if (formData.reason === "PURCHASE" && !formData.supplier_id) {
            alert("Please select a supplier for purchase stock-in")
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
            // 1. Create the transaction record
            const transactionData = {
                id: uuidv4(),
                type: "IN",
                item_id: formData.item_id,
                shop_id: activeShop!.id,
                quantity: parseFloat(formData.quantity),
                reason: formData.reason,
                supplier_id: formData.reason === "PURCHASE" ? formData.supplier_id : undefined,
                reference_id: formData.reference_id || undefined,
                notes: formData.notes || undefined,
                shift_id: activeShift!.id,
                created_by: userInfo?.id || "system",
                created_at: new Date().toISOString(),
            }

            await createTransaction(transactionData)

            // 2. Update the stock level
            // We need to fetch the current level first, then add to it
            const { stockLevelService } = await import("@/services/stock-level.service")

            try {
                // Try to get existing stock level
                const currentLevel = await stockLevelService.getStockLevelByItemAndShop(
                    formData.item_id,
                    activeShop!.id
                )

                // If exists, update (PUSH/PATCH)
                // Note: If the API returns the object, we use it. If it returns null/error, we catch below.
                if (currentLevel) {
                    const newQuantity = (currentLevel.quantity || 0) + parseFloat(formData.quantity)
                    await stockLevelService.updateStockLevel(
                        formData.item_id,
                        activeShop!.id,
                        { quantity: newQuantity }
                    )
                }
            } catch (error) {
                // If fetching fails (likely 404 Not Found), we create a new stock level record
                await stockLevelService.setStockLevel({
                    item_id: formData.item_id,
                    shop_id: activeShop!.id,
                    quantity: parseFloat(formData.quantity),
                })
            }

            // Close dialog and trigger success callback
            onOpenChange(false)
            if (onSuccess) {
                onSuccess()
            }
        } catch (error: any) {
            console.error("Error processing stock-in:", error)
            alert(error.message || "Failed to process stock-in. Please try again.")
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
                        <h2 className="text-2xl font-bold">Stock In</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Record incoming stock from purchases or adjustments
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
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    type="button"
                                                    variant={formData.reason === "PURCHASE" ? "default" : "outline"}
                                                    className="h-14 text-base"
                                                    onClick={() => handleReasonChange("PURCHASE")}
                                                >
                                                    Purchase
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

                                        {/* Supplier (conditional) */}
                                        {formData.reason === "PURCHASE" && (
                                            <div>
                                                <Label htmlFor="supplier_id" className="text-base mb-2 block">
                                                    Supplier <span className="text-destructive">*</span>
                                                </Label>
                                                {suppliersLoading ? (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Loading suppliers...
                                                    </div>
                                                ) : (
                                                    <select
                                                        id="supplier_id"
                                                        value={formData.supplier_id}
                                                        onChange={(e) =>
                                                            handleInputChange("supplier_id", e.target.value)
                                                        }
                                                        className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <option value="">Select a supplier</option>
                                                        {suppliers.map((supplier) => (
                                                            <option key={supplier.id} value={supplier.id}>
                                                                {supplier.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        )}

                                        {/* Reference ID */}
                                        <div className={formData.reason === "PURCHASE" ? "" : "md:col-span-2"}>
                                            <Label htmlFor="reference_id" className="text-base mb-2 block">
                                                Reference ID (Optional)
                                            </Label>
                                            <Input
                                                id="reference_id"
                                                placeholder="PO number, invoice, etc."
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
                                                placeholder="Additional notes..."
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
                                            className="h-12 px-6 bg-green-600 hover:bg-green-700"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Recording...
                                                </>
                                            ) : (
                                                <>
                                                    <Package className="h-4 w-4 mr-2" />
                                                    Record Stock In
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
