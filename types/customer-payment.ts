import { BaseEntity } from "./common";

export type PaymentMethod = 'CASH' | 'MPESA' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
export type TransactionType = 'CREDIT' | 'DEBIT' | 'REFUND' | 'ADJUSTMENT';

export interface CustomerPaymentAccount extends BaseEntity {
    customer_id: string;
    balance: number;
    created_at: string;
    created_by: string;
    description?: string; // Often included in accounts list
    // Sync metadata
    _last_modified_at: string;
    _version: number;
    _is_pending: boolean;
    _synced_at?: string;
}

export interface CustomerPaymentTransaction extends BaseEntity {
    account_id: string;
    sale_id?: string | null;
    shift_id?: string | null;
    type: TransactionType;
    amount: number;
    payment_method: PaymentMethod;
    notes?: string | null;
    created_at: string;
    created_by: string;

    // Additional fields often returned by API for display
    customerName?: string;
    customerId?: string;

    // Sync metadata
    _is_pending?: boolean;
    _version?: number;
    _last_modified_at?: string;
    _synced_at?: string;
}

export interface CreatePaymentDTO {
    customer_id: string;
    amount: number;
    created_by: string;
    payment_method: PaymentMethod;
    shift_id?: string;
    notes?: string;
}

export interface CreateDebitDTO {
    customer_id: string;
    amount: number;
    created_by: string;
    payment_method?: PaymentMethod; // Default CASH usually
    sale_id?: string;
    shift_id?: string;
    notes?: string;
}
