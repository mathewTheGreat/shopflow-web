export interface SaleReportItem {
    id: string;
    sale_id: string;
    item_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    created_at: string;
    item: {
        name: string;
    };
}

export interface SaleReportPayment {
    id: string;
    sale_id: string;
    payment_method: string;
    amount: number;
    created_at: string;
}

export interface SaleReport {
    id: string;
    shop_id: string;
    customer_id: string | null;
    shift_id: string;
    sale_date: string;
    total_amount: number;
    sale_category: "IMMEDIATE" | "CREDIT" | "PREPAID";
    notes: string;
    created_at: string;
    created_by: string;
    customer: {
        id: string;
        name: string;
        contact: string | null;
        email: string | null;
        phone?: string | null;
    } | null;
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
    saleItems: SaleReportItem[];
    salePayments: SaleReportPayment[];
}

export interface SalesReportFilter {
    shopId: string;
    startDate?: string;
    endDate?: string;
    cashierId?: string;
    customerId?: string;
    saleCategory?: string;
}
