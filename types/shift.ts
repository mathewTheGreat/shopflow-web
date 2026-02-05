import { BaseEntity } from "./common";

export interface Shift extends BaseEntity {
    name: string;
    shop_id: string;
    manager_id: string;
    start_time: string;
    end_time: string;
    is_closed: boolean;
}

export interface ShiftReconciliation extends BaseEntity {
    shift_id: string;
    expected_cash_sales: number;
    expected_mpesa_sales: number;
    actual_cash_amount: number;
    actual_mpesa_amount?: number | null;
    expected_cash_movements: number;
    expected_mpesa_movements: number;
    status: 'PENDING' | 'RECONCILED';
    reconciled_by?: string | null;
    reconciliation_date?: string | null;
    notes?: string | null;
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
