"use client"

import { useEffect, useMemo } from "react"
import { Loader2, ArrowLeft, Package, AlertTriangle } from "lucide-react"
import { useProductionBatch, useCancelProductionBatch } from "@/hooks/use-production"
import { useItems } from "@/hooks/use-items"
import { ProductionBatch, ProductionBatchStatus } from "@/types/production"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"

const statusColors: Record<ProductionBatchStatus, string> = {
    DRAFT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    FINALIZED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
}

interface ProductionBatchDetailsProps {
    batchId: string
    onBack: () => void
    onCloseBatch: (batch: ProductionBatch) => void
}

export function ProductionBatchDetails({
    batchId,
    onBack,
    onCloseBatch,
}: ProductionBatchDetailsProps) {
    const { data: batch, isLoading, refetch } = useProductionBatch(batchId)
    const { mutateAsync: cancelBatch, isPending: isCancelling } = useCancelProductionBatch()
    const { items } = useItems()

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
                {batch.status === "DRAFT" && (
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
                    <div className="p-4 border-b bg-muted/40">
                        <h3 className="font-medium">Outputs</h3>
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
                                    <span className="font-medium">{output.quantity}</span>
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
        </div>
    )
}
