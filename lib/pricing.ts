import { ItemPricing, QuantityDiscount } from "@/types/pricing";

interface CalculatePriceParams {
    basePrice: number;
    quantity: number;
    pricingRules: ItemPricing[];
    discountRules: QuantityDiscount[];
}

interface PriceResult {
    unitPrice: number;
    totalPrice: number;
    originalUnitPrice: number;
    appliedOverride?: ItemPricing;
    appliedDiscount?: QuantityDiscount;
    isDiscounted: boolean;
    isOverridden: boolean;
}

export function calculateEffectivePrice({
    basePrice,
    quantity,
    pricingRules,
    discountRules,
}: CalculatePriceParams): PriceResult {
    let currentUnitPrice = basePrice;
    let isOverridden = false;
    let isDiscounted = false;
    let appliedOverride: ItemPricing | undefined;
    let appliedDiscount: QuantityDiscount | undefined;

    // 1. Apply Shop-Specific Overrides (ItemPricing)
    // Find active overrides that match the quantity range
    const validOverrides = pricingRules.filter(
        (rule) =>
            rule.is_active &&
            (rule.min_quantity === null || rule.min_quantity === undefined || quantity >= rule.min_quantity) &&
            (rule.max_quantity === null || rule.max_quantity === undefined || quantity <= rule.max_quantity)
    );

    if (validOverrides.length > 0) {
        // Sort by min_quantity descending to find the most specific rule (largest min_quantity)
        const bestOverride = validOverrides.sort((a, b) => (b.min_quantity || 0) - (a.min_quantity || 0))[0];
        currentUnitPrice = bestOverride.override_price;
        isOverridden = true;
        appliedOverride = bestOverride;
    }

    // 2. Apply Quantity Discounts
    // Find active discounts that match the quantity
    const validDiscounts = discountRules.filter(
        (rule) => rule.is_active && quantity >= rule.min_quantity
    );

    if (validDiscounts.length > 0) {
        // Find the discount with the highest min_quantity
        const bestDiscount = validDiscounts.sort((a, b) => b.min_quantity - a.min_quantity)[0];

        if (bestDiscount.discount_percent) {
            currentUnitPrice = currentUnitPrice * (1 - bestDiscount.discount_percent / 100);
            isDiscounted = true;
            appliedDiscount = bestDiscount;
        } else if (bestDiscount.discount_amount) {
            currentUnitPrice = Math.max(0, currentUnitPrice - bestDiscount.discount_amount);
            isDiscounted = true;
            appliedDiscount = bestDiscount;
        }
    }

    return {
        unitPrice: currentUnitPrice,
        totalPrice: currentUnitPrice * quantity,
        originalUnitPrice: basePrice,
        appliedOverride,
        appliedDiscount,
        isDiscounted,
        isOverridden,
    };
}
