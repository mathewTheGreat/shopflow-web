"use client"

import { useState, useEffect, useMemo } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Loader2, ClipboardList, Check, AlertCircle } from "lucide-react"
import { useItems } from "@/hooks/use-items"
import { useStockLevelsByShop, useBulkUpdateStockLevels } from "@/hooks/use-stock-levels"
import { useCreateBulkStockTakes } from "@/hooks/use-stock-takes"
import { useCreateBulkTransactions } from "@/hooks/use-stock-transactions"
import { useAppStore } from "@/store/use-app-store"
import { Card, CardContent } from "../ui/card"
import { v4 as uuidv4 } from "uuid"
import { Checkbox } from "@/components/ui/checkbox"

interface StockTakeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

interface ItemCount {
    counted_qty: string
    notes: string
}

export function StockTakeDialog({ open, onOpenChange, onSuccess }: StockTakeDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [autoAdjust, setAutoAdjust] = useState(true)

    // Global State
    const activeShop = useAppStore((state) => state.activeShop)
    const activeShift = useAppStore((state) => state.activeShift)
    const userInfo = useAppStore((state) => state.userInfo)

    // Data Fetching
    const { items, isLoading: itemsLoading } = useItems()
    const { data: stockLevels = [], isLoading: levelsLoading } = useStockLevelsByShop(activeShop?.id || "")

    // Mutations
    const { mutateAsync: createBulkStockTakes } = useCreateBulkStockTakes()
    const { mutateAsync: bulkUpdateLevels } = useBulkUpdateStockLevels()
    const { mutateAsync: createBulkTransactions } = useCreateBulkTransactions()

    // Form state: { [itemId: string]: ItemCount }
    const [formData, setFormData] = useState<Record<string, ItemCount>>({})

    // Initialize/Reset form
    useEffect(() => {
        if (open && items.length > 0) {
            const initialForm: Record<string, ItemCount> = {}
            items.forEach(item => {
                initialForm[item.id] = { counted_qty: "", notes: "" }
            })
            setFormData(initialForm)
        }
    }, [open, items])

    // Lookup map for stock levels
    const stockLevelMap = useMemo(() => {
        const map: Record<string, number> = {}
        stockLevels.forEach(level => {
            map[level.item_id] = level.quantity
        })
        return map
    }, [stockLevels])

    const handleCountChange = (itemId: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], counted_qty: value }
        }))
    }

    const handleNoteChange = (itemId: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], notes: value }
        }))
    }

    // Derived statistics
    const itemsWithCounts = useMemo(() => {
        return Object.values(formData).filter(f => f.counted_qty !== "").length
    }, [formData])

    const allItemsFilled = useMemo(() => {
        if (items.length === 0) return false
        return items.every(item => formData[item.id]?.counted_qty !== "")
    }, [items, formData])

    const handleSubmit = async () => {
        if (!activeShop?.id || !activeShift?.id) {
            alert("Shop and Shift must be active")
            return
        }

        setIsSubmitting(true)
        const timestamp = new Date().toISOString()

        try {
            const stockTakes = []
            const adjustments = []
            const transactions = []

            for (const item of items) {
                const countData = formData[item.id]
                const expectedQty = stockLevelMap[item.id] || 0
                const countedQty = parseFloat(countData.counted_qty)
                const variance = countedQty - expectedQty

                // 1. Prepare Stock Take Record
                stockTakes.push({
                    id: uuidv4(),
                    item_id: item.id,
                    shop_id: activeShop.id,
                    shift_id: activeShift.id,
                    expected_qty: expectedQty,
                    counted_qty: countedQty,
                    variance: variance,
                    notes: countData.notes || undefined,
                    is_adjusted: autoAdjust && variance !== 0,
                    created_at: timestamp
                })

                // 2. Prepare Adjustment if needed
                if (autoAdjust && variance !== 0) {
                    adjustments.push({
                        item_id: item.id,
                        shop_id: activeShop.id,
                        quantity: countedQty, // Sets exact quantity as per requirement
                        last_updated: timestamp
                    })

                    transactions.push({
                        id: uuidv4(),
                        type: "ADJUSTMENT",
                        item_id: item.id,
                        shop_id: activeShop.id,
                        quantity: variance, // Usually transactions record the delta
                        reason: "ADJUSTMENT",
                        notes: countData.notes || `Stock Take Adjustment (Variance: ${variance})`,
                        shift_id: activeShift.id,
                        created_by: userInfo?.id || "system",
                        created_at: timestamp
                    })
                }
            }

            // Execute all in "quasi-batch" (sequential for now as they are independent mutations but ideally should be atomic)
            await createBulkStockTakes(stockTakes)

            if (adjustments.length > 0) {
                await bulkUpdateLevels(adjustments)
                await createBulkTransactions(transactions)
            }

            onOpenChange(false)
            if (onSuccess) onSuccess()
        } catch (error: any) {
            console.error("Stock Take submission failed:", error)
            alert(error.message || "Failed to record stock take")
        } finally {
            setIsSubmitting(false)
        }
    }

    const isLoading = itemsLoading || levelsLoading

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="h-[100vh] w-full p-0 gap-0 overflow-hidden flex flex-col max-w-none"
            >
                {/* Header */}
                <div className="sticky top-0 bg-card z-10 border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold">Stock Taking - All Items</h2>
                        <p className="text-sm text-muted-foreground mt-1 text-balance">
                            {items.length} items found. Enter physical quantities below.
                            <span className="ml-2 font-medium text-primary">
                                {itemsWithCounts} item(s) with quantities entered
                            </span>
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto min-h-0 bg-muted/30">
                    <div className="p-6 md:p-8 lg:p-12 space-y-6">
                        <div className="max-w-4xl mx-auto space-y-4">
                            {/* Adjustment Toggle */}
                            <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <AlertCircle className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Auto-Adjust Stock Levels</p>
                                            <p className="text-xs text-muted-foreground">Automatically update shop inventory to match your physical count</p>
                                        </div>
                                    </div>
                                    <Checkbox
                                        id="autoAdjust"
                                        checked={autoAdjust}
                                        onCheckedChange={(checked) => setAutoAdjust(!!checked)}
                                        className="h-6 w-6"
                                    />
                                </CardContent>
                            </Card>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                                    <p>Loading inventory data...</p>
                                </div>
                            ) : (
                                items.map((item) => {
                                    const expectedQty = stockLevelMap[item.id] || 0
                                    const count = formData[item.id]
                                    const variance = count?.counted_qty !== "" ? parseFloat(count?.counted_qty) - expectedQty : null

                                    return (
                                        <Card key={item.id} className="overflow-hidden border-border/50">
                                            <CardContent className="p-6 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-lg font-bold">{item.name}</h3>
                                                        <p className="text-sm text-muted-foreground">Unit: {item.unit_of_measure}</p>
                                                    </div>
                                                    {variance !== null && (
                                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${variance === 0 ? "bg-gray-100 text-gray-600" :
                                                                variance > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                            }`}>
                                                            {variance > 0 ? "+" : ""}{variance} {item.unit_of_measure} Variance
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
                                                    <span className="text-sm font-medium">Current System Quantity:</span>
                                                    <span className="text-lg font-bold">{expectedQty}</span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`count-${item.id}`} className="text-sm font-bold">Counted Quantity</Label>
                                                        <Input
                                                            id={`count-${item.id}`}
                                                            type="number"
                                                            placeholder="Enter counted quantity"
                                                            value={count?.counted_qty || ""}
                                                            onChange={(e) => handleCountChange(item.id, e.target.value)}
                                                            className="h-12 text-lg font-medium"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`note-${item.id}`} className="text-sm font-bold">Notes (Optional)</Label>
                                                        <Input
                                                            id={`note-${item.id}`}
                                                            placeholder="Add notes about this stock count..."
                                                            value={count?.notes || ""}
                                                            onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                                            className="h-12"
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-card border-t border-border flex gap-4 flex-shrink-0">
                    <Button
                        variant="outline"
                        className="flex-1 h-14 text-lg font-bold"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 h-14 text-lg font-bold bg-primary hover:bg-primary/90"
                        disabled={isSubmitting || !allItemsFilled}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="h-5 w-5 mr-3 animate-spin" /> Processing...</>
                        ) : (
                            <><ClipboardList className="h-5 w-5 mr-3" /> Record Stock Count(s)</>
                        )}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
