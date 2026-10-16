import { BaseEntity } from "./common";

export interface Expense extends BaseEntity {
    shop_id: string;
    shift_id: string;
    expense_date: string;
    amount: number;
    description?: string | null;
    category: string;
    notes?: string | null;
    created_by: string;
    payment_method: 'CASH' | 'MPESA';
    status?: 'POSTED' | 'VOIDED';
    voided_at?: string | null;
    voided_by?: string | null;
    void_reason?: string | null;
}
