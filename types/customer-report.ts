import { CustomerPaymentAccount, TransactionType, PaymentMethod } from "./customer-payment";

export interface NetPositionTransaction {
    id: string;
    type: TransactionType;
    amount: number;
    payment_method: PaymentMethod;
    notes: string | null;
    created_at: string;
    created_by_name: string;
    sale_id: string | null;
    shift_id: string | null;
    runningBalance: number;
}

export interface CustomerNetPositionReport {
    account: CustomerPaymentAccount;
    openingBalance: number;
    closingBalance: number;
    transactions: NetPositionTransaction[];
}
