import { BaseEntity } from "./common";

export interface ItemPricing extends BaseEntity {
    item_id: string;
    shop_id: string;
    override_price: number;
    min_quantity?: number | null;
    max_quantity?: number | null;
    is_active: boolean;
    created_by: string;
}

export interface QuantityDiscount extends BaseEntity {
    item_id: string;
    shop_id: string;
    min_quantity: number;
    discount_percent?: number | null;
    discount_amount?: number | null;
    is_active: boolean;
    created_by: string;
}

export interface PriceHistory {
    id: string;
    item_id: string;
    shop_id?: string | null;
    old_price?: number | null;
    new_price: number;
    change_type: 'BASE_PRICE' | 'OVERRIDE' | 'DISCOUNT_RULE';
    rule_id?: string | null;
    rule_type?: 'PRICING' | 'DISCOUNT' | null;
    change_reason?: string | null;
    effective_date?: string | null;
    created_at?: string | null;
    created_by: string;
}
