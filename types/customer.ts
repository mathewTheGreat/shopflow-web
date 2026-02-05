import { BaseEntity } from "./common";

export interface Customer extends BaseEntity {
    name: string;
    contact?: string | null;
    email?: string | null;
    shop_id?: string | null;
    phone?: string | null;
    created_by?: string | null;
}

export interface CustomerPaymentAccount extends BaseEntity {
    customer_id: string;
    balance: number;
    created_by: string;
}

export interface CustomerPaymentTransaction extends BaseEntity {
    account_id: string;
    sale_id?: string | null;
    shift_id?: string | null;
    type: 'CREDIT' | 'DEBIT' | 'REFUND' | 'ADJUSTMENT';
    amount: number;
    payment_method: 'CASH' | 'MPESA' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
    notes?: string | null;
    created_by: string;
}
