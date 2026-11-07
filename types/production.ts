export type ProductionProcessType = "PASTEURIZATION" | "OTHER"

export type ProductionBatchStatus = "DRAFT" | "IN_PROGRESS" | "FINALIZED" | "CANCELLED"

export type ProductionSortBy = "created_at" | "total_input_quantity" | "total_output_quantity" | "total_loss_quantity"
export type ProductionSortOrder = "asc" | "desc"

export interface ProductionBatchesQueryParams {
    page?: number
    limit?: number
    status?: ProductionBatchStatus
    process_type?: ProductionProcessType
    sort_by?: ProductionSortBy
    sort_order?: ProductionSortOrder
    search?: string
}

export interface ProductionBatchesResponse {
    data: ProductionBatch[]
    pagination: {
        page: number
        limit: number
        total: number
        total_pages: number
    }
}

export interface ProductionInput {
    id: string
    batch_id: string
    item_id: string
    item_name?: string
    quantity: number
    stock_transaction_id: string
}

export interface ProductionOutput {
    id: string
    batch_id: string
    item_id: string
    item_name?: string
    quantity: number
    stock_transaction_id: string
}

export interface AmendBatchLine {
    lineId?: string
    item_id: string
    quantity: number
}

export interface AmendBatchRequest {
    inputs?: AmendBatchLine[]
    outputs?: AmendBatchLine[]
    reason: string
    shift_id?: string
    adjust_stock?: boolean
}

export interface ProductionBatchAmendment {
    id: string
    amended_by: string
    amended_by_name: string | null
    reason: string
    responsible_shift_id: string | null
    recorded_shift_id: string | null
    stock_adjustment_applied: boolean | null
    lines: Array<{
        kind: "input" | "output"
        line_id: string | null
        item_id: string
        old_item_id: string | null
        old_quantity: number
        new_quantity: number
        stock_transaction_ids: string[]
    }>
    created_at: string | null
}

export interface ProductionBatch {
    id: string
    shop_id: string
    start_shift_id: string
    finalized_shift_id?: string
    original_shift_id?: string
    finalized_by?: string
    process_type: ProductionProcessType
    status: ProductionBatchStatus
    total_input_quantity: number | null
    total_output_quantity: number | null
    total_loss_quantity: number | null
    notes?: string
    created_by: string
    finalized_at?: string
    created_at?: string
    _version: number
    _is_pending: boolean
    inputs: ProductionInput[]
    outputs: ProductionOutput[]
    responsible_shift?: {
        id: string
        manager_id: string
        is_closed: boolean
        closing_status: string | null
        rejection_reason?: string | null
        name: string
    } | null
    amendments?: ProductionBatchAmendment[]
}

export interface OpenBatchRequest {
    id: string
    shop_id: string
    start_shift_id: string
    created_by: string
    process_type: ProductionProcessType
    notes?: string
    inputs: {
        item_id: string
        quantity: number
    }[]
}

export interface CloseBatchRequest {
    finalized_shift_id: string
    finalized_by: string
    notes?: string
    outputs?: {
        item_id: string
        quantity: number
    }[]
}

export interface CancelBatchRequest {
    cancelled_by: string
}

export interface AddOutputRequest {
    shift_id: string
    added_by: string
    outputs: {
        item_id: string
        quantity: number
    }[]
}

export interface UpdateOutputRequest {
    item_id: string
    quantity: number
}

export interface DeleteOutputRequest {
    deleted_by: string
}

export interface ProductionReportParams {
    date?: string
    start_date?: string
    end_date?: string
    status?: ProductionBatchStatus
    process_type?: ProductionProcessType
}

export interface ProductionReportSummary {
    totalBatches: number
    finalizedBatches: number
    inProgressBatches: number
    draftBatches: number
    cancelledBatches: number
    totalInputQuantity: number
    totalOutputQuantity: number
    totalLossQuantity: number
    averageEfficiency: number
}

export interface ProductionReportData {
    batches: ProductionBatch[]
    summary: ProductionReportSummary
}
