import { BaseEntity } from "./common";

export interface Sale extends BaseEntity {
    shop_id: string;
    customer_id?: string | null;
    shift_id: string;
    sale_date: string;
    total_amount: number;
    sale_category: 'IMMEDIATE' | 'CREDIT' | 'PREPAID';
    notes?: string | null;
    created_by?: string | null;
}

export interface SaleItem extends BaseEntity {
    sale_id: string;
    item_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    created_by?: string | null;
}

export interface SalePayment extends BaseEntity {
    sale_id: string;
    shift_id: string;
    payment_method: 'CASH' | 'MPESA' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
    amount: number;
    notes?: string | null;
    created_by: string;
}

export interface Expense extends BaseEntity {
    shop_id: string;
    shift_id: string;
    expense_date: string;
    amount: number;
    description?: string | null;
    category: string;
    notes?: string | null;
    created_by?: string | null;
}
