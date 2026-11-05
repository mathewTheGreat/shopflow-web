"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, ArrowLeft, Package, AlertTriangle, Plus, Trash2, Pencil } from "lucide-react"
import { useProductionBatch, useCancelProductionBatch, useAddProductionOutput, useAmendProductionBatch } from "@/hooks/use-production"
import { useItems } from "@/hooks/use-items"
import { useAppStore } from "@/store/use-app-store"
import { ProductionBatch, ProductionBatchStatus } from "@/types/production"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const statusColors: Record<ProductionBatchStatus, string> = {
    DRAFT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    FINALIZED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
}

interface ProductionBatchDetailsProps {
    batchId: string
    onBack: () => void
    onCloseBatch: (batch: ProductionBatch) => void
}

interface OutputItem {
    item_id: string
    quantity: string
}

export function ProductionBatchDetails({
    batchId,
    onBack,
    onCloseBatch,
}: ProductionBatchDetailsProps) {
    const { data: batch, isLoading, refetch } = useProductionBatch(batchId)
    const { mutateAsync: cancelBatch, isPending: isCancelling } = useCancelProductionBatch()
    const { mutateAsync: addOutput, isPending: isAddingOutput } = useAddProductionOutput()
    const { mutateAsync: amendBatch, isPending: isAmending } = useAmendProductionBatch()
    const { items } = useItems()
    const userInfo = useAppStore((state) => state.userInfo)
    const activeShift = useAppStore((state) => state.activeShift)
    const responsibleShift = batch?.responsible_shift
    const canCorrectBatch = Boolean(
        batch &&
        batch.status !== "CANCELLED" &&
        responsibleShift &&
        userInfo?.id === responsibleShift.manager_id &&
        (!responsibleShift.is_closed ||
            responsibleShift.closing_status === "REJECTED" ||
            responsibleShift.closing_status === "PENDING_CORRECTION_APPROVAL")
    )
    const canOperateBatch = Boolean(activeShift)

    const [showAddOutput, setShowAddOutput] = useState(false)
    const [newOutputs, setNewOutputs] = useState<OutputItem[]>([{ item_id: "", quantity: "" }])
    const [showAmend, setShowAmend] = useState(false)
    const [amendQtys, setAmendQtys] = useState<Record<string, string>>({})
    const [amendReason, setAmendReason] = useState("")
    const [adjustStock, setAdjustStock] = useState(false)

    const itemMap = useMemo(() => {
        const map: Record<string, string> = {}
        items.forEach((item) => {
            map[item.id] = item.name
        })
        return map
    }, [items])

    const getItemName = (itemId: string) => itemMap[itemId] || itemId

    const handleCancel = async () => {
        if (!batch) return

        const confirmCancel = window.confirm(
            "Are you sure you want to cancel this batch? This will restore the input stock."
        )

        if (confirmCancel) {
            await cancelBatch(batch.id)
            refetch()
        }
    }

    const handleAddOutput = async () => {
        if (!batch || !activeShift || !userInfo) return

        const validOutputs = newOutputs.filter(
            (o) => o.item_id && o.quantity && parseFloat(o.quantity) > 0
        )

        if (validOutputs.length === 0) {
            alert("Please add at least one output item")
            return
        }

        try {
            await addOutput({
                id: batch.id,
                data: {
                    shift_id: activeShift.id,
                    added_by: userInfo.id,
                    outputs: validOutputs.map((o) => ({
                        id: crypto.randomUUID(),
                        item_id: o.item_id,
                        quantity: parseFloat(o.quantity),
                        stock_transaction_id: crypto.randomUUID(),
                    })),
                },
            })
            setShowAddOutput(false)
            setNewOutputs([{ item_id: "", quantity: "" }])
            refetch()
        } catch (error) {
            console.error("Failed to add output:", error)
        }
    }

    const handleAmendBatch = async () => {
        if (!batch || !responsibleShift || !userInfo) return

        const reason = amendReason.trim()
        if (!reason) {
            alert("A reason is required to correct a batch")
            return
        }

        const changedInputs = (batch.inputs || [])
            .map((input) => ({
                lineId: input.id,
                item_id: input.item_id,
                quantity: parseFloat(amendQtys[`in:${input.id}`] ?? String(input.quantity)),
                oldQuantity: input.quantity,
            }))
            .filter((l) => Number.isFinite(l.quantity) && l.quantity >= 0 && l.quantity !== l.oldQuantity)

        const changedOutputs = (batch.outputs || [])
            .map((output) => ({
                lineId: output.id,
                item_id: output.item_id,
                quantity: parseFloat(amendQtys[`out:${output.id}`] ?? String(output.quantity)),
                oldQuantity: output.quantity,
            }))
            .filter((l) => Number.isFinite(l.quantity) && l.quantity >= 0 && l.quantity !== l.oldQuantity)

        if (changedInputs.length === 0 && changedOutputs.length === 0) {
            alert("Change at least one quantity to amend the batch")
            return
        }

        try {
            await amendBatch({
                id: batch.id,
                data: {
                    inputs: changedInputs.map(({ lineId, item_id, quantity }) => ({ lineId, item_id, quantity })),
                    outputs: changedOutputs.map(({ lineId, item_id, quantity }) => ({ lineId, item_id, quantity })),
                    reason,
                    shift_id: responsibleShift.id,
                    adjust_stock: adjustStock,
                },
            })
            setShowAmend(false)
            setAdjustStock(false)
            refetch()
        } catch (error) {
            console.error("Failed to amend batch:", error)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading batch details...</p>
            </div>
        )
    }

    if (!batch) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">Batch not found</p>
                <Button variant="link" onClick={onBack} className="mt-2">
                    Go back
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with back button and actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[batch.status]}`}
                            >
                                {batch.status}
                            </span>
                            <span className="text-muted-foreground">
                                {batch.process_type}
                            </span>
                        </div>
                    </div>
                </div>
                {batch.status === "DRAFT" && canOperateBatch && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isCancelling}
                        >
                            {isCancelling ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Cancel Batch
                        </Button>
                        <Button onClick={() => onCloseBatch(batch)} className="bg-primary hover:bg-primary/90">
                            Close Batch
                        </Button>
                    </div>
                )}
                {batch.status === "IN_PROGRESS" && canOperateBatch && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowAddOutput(true)}
                            disabled={isAddingOutput}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Output
                        </Button>
                        <Button onClick={() => onCloseBatch(batch)} className="bg-primary hover:bg-primary/90">
                            Close Batch
                        </Button>
                    </div>
                )}
                {canCorrectBatch && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                const initial: Record<string, string> = {}
                                ;(batch.inputs || []).forEach((i) => { initial[`in:${i.id}`] = String(i.quantity) })
                                ;(batch.outputs || []).forEach((o) => { initial[`out:${o.id}`] = String(o.quantity) })
                                setAmendQtys(initial)
                                setAmendReason("")
                                setAdjustStock(false)
                                setShowAmend(true)
                            }}
                        >
                            <Pencil className="h-4 w-4 mr-2" />
                            Correct Batch
                        </Button>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="font-medium">
                            {batch.created_at
                                ? format(new Date(batch.created_at), "MMM dd, yyyy HH:mm")
                                : "N/A"}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-card">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Input</p>
                        <p className="font-medium text-lg">{batch.total_input_quantity ?? "-"}</p>
                    </CardContent>
                </Card>
                <Card className="bg-card">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Output</p>
                        <p className="font-medium text-lg">
                            {batch.total_output_quantity ?? "-"}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-card">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Loss</p>
                        <p className={`font-medium text-lg ${batch.total_loss_quantity && batch.total_loss_quantity > 0 ? "text-red-500" : ""}`}>
                            {batch.total_loss_quantity ?? "-"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {batch.notes && (
                <Card className="bg-card">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">Notes</p>
                        <p>{batch.notes}</p>
                    </CardContent>
                </Card>
            )}

            {responsibleShift && (
                <Card className="bg-card">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">Responsible Shift</p>
                        <p className="font-medium">{responsibleShift.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {responsibleShift.closing_status || (responsibleShift.is_closed ? "Closed" : "Active")}
                        </p>
                    </CardContent>
                </Card>
            )}

            {batch.amendments && batch.amendments.length > 0 && (
                <Card className="bg-card">
                    <div className="p-4 border-b">
                        <h3 className="font-medium">Correction History</h3>
                    </div>
                    <div className="divide-y">
                        {batch.amendments.map((amendment) => (
                            <div key={amendment.id} className="p-4 space-y-2">
                                <div className="flex flex-wrap justify-between gap-2">
                                    <span className="font-medium">
                                        {amendment.amended_by_name || amendment.amended_by}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {amendment.created_at
                                            ? format(new Date(amendment.created_at), "MMM dd, yyyy HH:mm")
                                            : "Date unavailable"}
                                    </span>
                                </div>
                                <p className="text-sm">{amendment.reason}</p>
                                <p className="text-sm text-muted-foreground">
                                    {amendment.stock_adjustment_applied === null
                                        ? "Stock adjustment status was not recorded"
                                        : `Current stock ${amendment.stock_adjustment_applied ? "was adjusted" : "was not adjusted"}`}
                                    {amendment.responsible_shift_id ? ` · Shift ${amendment.responsible_shift_id}` : ""}
                                </p>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    {amendment.lines.map((line, index) => (
                                        <li key={`${amendment.id}:${line.line_id || index}`}>
                                            {line.kind === "input" ? "Input" : "Output"}:{" "}
                                            {line.old_item_id && line.old_item_id !== line.item_id
                                                ? `${getItemName(line.old_item_id)} → ${getItemName(line.item_id)}`
                                                : getItemName(line.item_id)}{" "}
                                            {line.old_quantity} → {line.new_quantity}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Inputs and Outputs */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-card overflow-hidden">
                    <div className="p-4 border-b bg-muted/40">
                        <h3 className="font-medium">Inputs</h3>
                    </div>
                    <div className="divide-y">
                        {batch.inputs.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                                No inputs
                            </div>
                        ) : (
                            batch.inputs.map((input) => (
                                <div key={input.id} className="p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <span>{getItemName(input.item_id)}</span>
                                    </div>
                                    <span className="font-medium">{input.quantity}</span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                <Card className="bg-card overflow-hidden">
                    <div className="p-4 border-b bg-muted/40 flex justify-between items-center">
                        <h3 className="font-medium">Outputs</h3>
                        {canOperateBatch && batch.status !== "FINALIZED" && batch.status !== "CANCELLED" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowAddOutput(true)
                                    setNewOutputs([{ item_id: "", quantity: "" }])
                                }}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                            </Button>
                        )}
                    </div>
                    <div className="divide-y">
                        {batch.outputs.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                                No outputs yet
                            </div>
                        ) : (
                            batch.outputs.map((output) => (
                                <div key={output.id} className="p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <span>{getItemName(output.item_id)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{output.quantity}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            {batch.total_loss_quantity && batch.total_loss_quantity > 0 && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-red-700">Production Loss</p>
                        <p className="text-sm text-red-600">
                            {batch.total_loss_quantity} units were lost during {batch.process_type.toLowerCase()}.
                            This has been automatically recorded.
                        </p>
                    </div>
                </div>
            )}

            {/* Add Output Dialog */}
            {showAddOutput && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background p-6 rounded-lg w-full max-w-md shadow-lg">
                        <h3 className="text-lg font-semibold mb-4">Add Output</h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {newOutputs.map((output, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <div className="flex-1">
                                        <Select
                                            value={output.item_id}
                                            onValueChange={(value) => {
                                                const newOut = [...newOutputs]
                                                newOut[index] = { ...newOut[index], item_id: value }
                                                setNewOutputs(newOut)
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select item" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {items.map((item) => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            placeholder="Qty"
                                            value={output.quantity}
                                            onChange={(e) => {
                                                const newOut = [...newOutputs]
                                                newOut[index] = { ...newOut[index], quantity: e.target.value }
                                                setNewOutputs(newOut)
                                            }}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            if (newOutputs.length > 1) {
                                                setNewOutputs(newOutputs.filter((_, i) => i !== index))
                                            }
                                        }}
                                        disabled={newOutputs.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNewOutputs([...newOutputs, { item_id: "", quantity: "" }])}
                            className="mt-3"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Another
                        </Button>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="ghost" onClick={() => setShowAddOutput(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddOutput} disabled={isAddingOutput}>
                                {isAddingOutput ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Output"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Correct Batch Dialog */}
            {showAmend && batch && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background p-6 rounded-lg w-full max-w-lg shadow-lg">
                        <h3 className="text-lg font-semibold mb-2">Correct Batch</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Corrections are recorded with your reason. The batch is attributed to {responsibleShift?.name || "its responsible shift"}.
                        </p>
                        <div className="space-y-4 max-h-[320px] overflow-y-auto">
                            <div>
                                <Label className="font-medium">Inputs (consumed)</Label>
                                <div className="space-y-2 mt-2">
                                    {(batch.inputs || []).map((input) => (
                                        <div key={input.id} className="flex gap-2 items-center">
                                            <div className="flex-1 text-sm truncate" title={getItemName(input.item_id)}>
                                                {getItemName(input.item_id)}
                                                <span className="text-muted-foreground"> (was {input.quantity})</span>
                                            </div>
                                            <div className="w-28">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={amendQtys[`in:${input.id}`] ?? String(input.quantity)}
                                                    onChange={(e) => setAmendQtys((prev) => ({ ...prev, [`in:${input.id}`]: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label className="font-medium">Outputs (produced)</Label>
                                <div className="space-y-2 mt-2">
                                    {(batch.outputs || []).map((output) => (
                                        <div key={output.id} className="flex gap-2 items-center">
                                            <div className="flex-1 text-sm truncate" title={getItemName(output.item_id)}>
                                                {getItemName(output.item_id)}
                                                <span className="text-muted-foreground"> (was {output.quantity})</span>
                                            </div>
                                            <div className="w-28">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={amendQtys[`out:${output.id}`] ?? String(output.quantity)}
                                                    onChange={(e) => setAmendQtys((prev) => ({ ...prev, [`out:${output.id}`]: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label>Reason (required)</Label>
                                <Input
                                    value={amendReason}
                                    onChange={(e) => setAmendReason(e.target.value)}
                                    placeholder="Why is this correction needed?"
                                    className="mt-1"
                                />
                            </div>
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="adjust-stock"
                                    checked={adjustStock}
                                    onCheckedChange={(checked) => setAdjustStock(checked === true)}
                                />
                                <div className="space-y-1">
                                    <Label htmlFor="adjust-stock">Adjust current stock</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Off by default. When checked, compensating stock movements are posted for the correction.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="ghost" onClick={() => setShowAmend(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAmendBatch} disabled={isAmending || !canCorrectBatch}>
                                {isAmending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Correction"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
