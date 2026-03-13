export type ProductionProcessType = "PASTEURIZATION" | "OTHER"

export type ProductionBatchStatus = "DRAFT" | "FINALIZED" | "CANCELLED"

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

export interface ProductionBatch {
    id: string
    shop_id: string
    start_shift_id: string
    finalized_shift_id?: string
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
    outputs: {
        item_id: string
        quantity: number
    }[]
}
