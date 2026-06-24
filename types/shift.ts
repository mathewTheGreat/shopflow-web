import { BaseEntity } from "./common";

export interface Shift extends BaseEntity {
    name: string;
    shop_id: string;
    manager_id: string;
    start_time: string;
    end_time: string;
    is_closed: boolean;
    closing_status?: 'OPEN' | 'PENDING_APPROVAL' | 'AMENDMENT_REQUESTED' | 'APPROVED';
    submitted_for_approval_at?: string | null;
    approved_by?: string | null;
    approved_at?: string | null;
    rejection_reasons?: Array<{ type: string; message: string; record_id?: string }> | null;
    amendment_count?: number;
    manager_name?: string;
}

export interface ShiftReconciliation extends BaseEntity {
    shift_id: string;
    amendment_attempt: number;
    expected_cash_sales: number;
    expected_mpesa_sales: number;
    actual_cash_amount: number;
    actual_mpesa_amount?: number | null;
    expected_cash_movements: number;
    expected_mpesa_movements: number;
    status: 'PENDING' | 'RECONCILED';
    reconciled_by?: string | null;
    reconciled_by_name?: string | null;
    reconciliation_date?: string | null;
    notes?: string | null;
    created_by: string;
}

export interface SaleCorrection {
    id: string;
    shift_id: string;
    sale_id: string;
    amendment_attempt: number;
    correction_type: 'REVERSE' | 'ADJUST_AMOUNT' | 'ADJUST_ITEMS';
    reason: string;
    original_amount: number;
    corrected_amount?: number;
    corrected_items?: Array<{ item_id: string; quantity: number; unit_price: number }>;
    created_at: string;
    created_by: string;
}

export interface ExpenseCorrection {
    id: string;
    shift_id: string;
    expense_id?: string;
    amendment_attempt: number;
    correction_type: 'REVERSE' | 'ADJUST_AMOUNT' | 'REVERSE_AND_READD';
    reason: string;
    original_amount: number;
    corrected_amount?: number;
    corrected_description?: string;
    created_at: string;
    created_by: string;
}

export interface CustomerPaymentCorrection {
    id: string;
    shift_id: string;
    transaction_id: string;
    amendment_attempt: number;
    correction_type: 'REVERSE' | 'ADJUST_AMOUNT' | 'REALLOCATE';
    reason: string;
    original_amount: number;
    corrected_amount?: number;
    reallocated_to_sale_id?: string;
    created_at: string;
    created_by: string;
}

export interface StockTakeCorrection {
    id: string;
    shift_id: string;
    stock_take_id: string;
    item_id: string;
    amendment_attempt: number;
    original_counted_qty: number;
    corrected_counted_qty: number;
    reason: string;
    created_at: string;
    created_by: string;
}

export interface ShiftCashMovement extends BaseEntity {
    shift_id: string;
    type: 'FLOAT_IN' | 'PAY_OUT' | 'PAY_IN';
    amount: number;
    payment_method: 'CASH' | 'MPESA' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
    reason?: string | null;
    created_by: string;
}

export interface ShiftFinancialsBreakdownDetailed {
    expectedCashSalesOnly: number;
    expectedMpesaSalesOnly: number;
    customerCashInflows: number;
    customerMpesaInflows: number;
    cashOpeningFloat: number;
    cashAdditionalFloat: number;
    cashPayIn: number;
    cashPayOut: number;
    mpesaOpeningFloat: number;
    mpesaAdditionalFloat: number;
    mpesaPayIn: number;
    mpesaPayOut: number;
    totalExpectedCash: number;
    totalExpectedMpesa: number;
}
