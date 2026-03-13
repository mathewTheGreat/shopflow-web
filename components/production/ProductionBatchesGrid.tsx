"use client"

import { useState } from "react"
import { Loader2, Factory, ChevronLeft, ChevronRight } from "lucide-react"
import { useProductionBatches } from "@/hooks/use-production"
import { useAppStore } from "@/store/use-app-store"
import { ProductionBatch, ProductionBatchStatus, ProductionProcessType, ProductionBatchesQueryParams } from "@/types/production"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const statusColors: Record<ProductionBatchStatus, string> = {
    DRAFT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    FINALIZED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
}

interface ProductionBatchesGridProps {
    onBatchClick: (batch: ProductionBatch) => void
}

export function ProductionBatchesGrid({ onBatchClick }: ProductionBatchesGridProps) {
    const activeShop = useAppStore((state) => state.activeShop)
    
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)
    const [status, setStatus] = useState<ProductionBatchStatus | "all">("all")
    const [processType, setProcessType] = useState<ProductionProcessType | "all">("all")
    const [sortBy, setSortBy] = useState<"created_at" | "total_input_quantity" | "total_output_quantity" | "total_loss_quantity">("created_at")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

    const queryParams: ProductionBatchesQueryParams = {
        page,
        limit,
        ...(status !== "all" && { status: status as ProductionBatchStatus }),
        ...(processType !== "all" && { process_type: processType as ProductionProcessType }),
        sort_by: sortBy,
        sort_order: sortOrder,
    }

    const { data: response, isLoading } = useProductionBatches(activeShop?.id, queryParams)

    const batches = response?.data || []
    const pagination = response?.pagination

    const handleStatusChange = (value: string) => {
        setStatus(value as ProductionBatchStatus | "all")
        setPage(1)
    }

    const handleProcessTypeChange = (value: string) => {
        setProcessType(value as ProductionProcessType | "all")
        setPage(1)
    }

    const handleSortByChange = (value: string) => {
        setSortBy(value as typeof sortBy)
        setPage(1)
    }

    const handleSortOrderChange = (value: string) => {
        setSortOrder(value as "asc" | "desc")
        setPage(1)
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading production batches...</p>
            </div>
        )
    }

    if (!batches || batches.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                    <Select value={status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[140px] bg-card">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="FINALIZED">Finalized</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={processType} onValueChange={handleProcessTypeChange}>
                        <SelectTrigger className="w-[160px] bg-card">
                            <SelectValue placeholder="All Process Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Process Types</SelectItem>
                            <SelectItem value="PASTEURIZATION">Pasteurization</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={handleSortByChange}>
                        <SelectTrigger className="w-[160px] bg-card">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="created_at">Date</SelectItem>
                            <SelectItem value="total_input_quantity">Input Qty</SelectItem>
                            <SelectItem value="total_output_quantity">Output Qty</SelectItem>
                            <SelectItem value="total_loss_quantity">Loss</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sortOrder} onValueChange={handleSortOrderChange}>
                        <SelectTrigger className="w-[100px] bg-card">
                            <SelectValue placeholder="Order" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="desc">Desc</SelectItem>
                            <SelectItem value="asc">Asc</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-card/50 px-6">
                    <div className="bg-muted/20 p-4 rounded-full mb-4">
                        <Factory className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">No production batches</p>
                    <p className="text-sm text-muted-foreground/80 mt-1">
                        Open a production batch to get started
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
                <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[140px] bg-card">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="FINALIZED">Finalized</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={processType} onValueChange={handleProcessTypeChange}>
                    <SelectTrigger className="w-[160px] bg-card">
                        <SelectValue placeholder="All Process Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Process Types</SelectItem>
                        <SelectItem value="PASTEURIZATION">Pasteurization</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={handleSortByChange}>
                    <SelectTrigger className="w-[160px] bg-card">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="created_at">Date</SelectItem>
                        <SelectItem value="total_input_quantity">Input Qty</SelectItem>
                        <SelectItem value="total_output_quantity">Output Qty</SelectItem>
                        <SelectItem value="total_loss_quantity">Loss</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={handleSortOrderChange}>
                    <SelectTrigger className="w-[100px] bg-card">
                        <SelectValue placeholder="Order" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="desc">Desc</SelectItem>
                        <SelectItem value="asc">Asc</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
                <div className="grid grid-cols-6 p-4 border-b bg-muted/40 font-medium text-sm text-muted-foreground">
                    <div>Date</div>
                    <div>Process Type</div>
                    <div>Status</div>
                    <div className="text-right">Inputs</div>
                    <div className="text-right">Outputs</div>
                    <div className="text-right">Loss</div>
                </div>
                <div className="divide-y">
                    {batches.map((batch) => (
                        <div
                            key={batch.id}
                            onClick={() => onBatchClick(batch)}
                            className="grid grid-cols-6 p-4 items-center hover:bg-muted/50 transition-colors cursor-pointer text-sm"
                        >
                            <div className="text-muted-foreground">
                                {batch.created_at
                                    ? format(new Date(batch.created_at), "MMM dd, HH:mm")
                                    : "N/A"}
                            </div>
                            <div className="font-medium text-foreground">
                                {batch.process_type}
                            </div>
                            <div>
                                <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[batch.status]}`}
                                >
                                    {batch.status}
                                </span>
                            </div>
                            <div className="text-right font-semibold">
                                {batch.total_input_quantity ?? "-"}
                            </div>
                            <div className="text-right font-semibold">
                                {batch.total_output_quantity ?? "-"}
                            </div>
                            <div className="text-right">
                                {batch.total_loss_quantity !== null ? (
                                    <span className="text-red-500">
                                        {batch.total_loss_quantity}
                                    </span>
                                ) : (
                                    "-"
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                        {pagination.total} results
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                            Page {pagination.page} of {pagination.total_pages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={page === pagination.total_pages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
