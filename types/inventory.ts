import { BaseEntity } from "./common";

export interface Item extends BaseEntity {
    name: string;
    description?: string | null;
    item_type: string;
    unit_of_measure: string;
    sale_price?: number | null;
    cost_price: number;
    quantity?: number | null;
    created_by?: string | null;
}

export interface StockLevel extends BaseEntity {
    item_id: string;
    shop_id: string;
    quantity: number;
    last_updated?: string | null;
}

export interface StockTransaction extends BaseEntity {
    supplier_id?: string | null;
    type: string;
    item_id: string;
    shop_id: string;
    quantity: number;
    reference_id?: string | null;
    reason: string;
    notes?: string | null;
    shift_id: string;
    related_transaction_id?: string | null;
    created_by?: string | null;
}

export interface ShopItemAvailability extends BaseEntity {
    shop_id: string;
    item_id: string;
    is_available: boolean;
}

export interface StockTake extends BaseEntity {
    item_id: string;
    shop_id: string;
    shift_id: string;
    expected_qty: number;
    counted_qty: number;
    variance: number;
    notes?: string | null;
    is_adjusted: boolean;
}
