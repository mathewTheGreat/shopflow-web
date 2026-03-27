import { ItemPrice } from "@/types/pricing";

export function getSelectedPrice(
    prices: ItemPrice[],
    selectedPriceId?: string
): ItemPrice | undefined {
    if (selectedPriceId) {
        return prices.find(p => p.id === selectedPriceId && p.is_active);
    }
    
    return prices.find(p => p.is_default && p.is_active);
}

export function getDefaultPrice(prices: ItemPrice[]): ItemPrice | undefined {
    return prices.find(p => p.is_default && p.is_active);
}

export function getActivePrices(prices: ItemPrice[]): ItemPrice[] {
    return prices.filter(p => p.is_active).sort((a, b) => {
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        return (a.min_quantity ?? 1) - (b.min_quantity ?? 1);
    });
}

export function getApplicablePrice(
    prices: ItemPrice[],
    quantity: number
): ItemPrice | undefined {
    const activePrices = prices.filter(p => p.is_active);
    
    if (activePrices.length === 0) return undefined;
    
    // First, check if there's a flat price tier that exactly matches the quantity
    // Flat price takes absolute precedence
    const flatPrice = activePrices.find(p => 
        p.min_quantity === p.max_quantity && p.min_quantity === quantity
    );
    
    if (flatPrice) {
        return flatPrice;
    }
    
    // Second, check if default price is applicable for this quantity
    const defaultPrice = activePrices.find(p => p.is_default);
    if (defaultPrice && isQuantityInPriceRange(defaultPrice, quantity)) {
        return defaultPrice;
    }
    
    // Third, check other non-default prices that match the quantity range
    const otherMatchingPrice = activePrices.find(p => 
        !p.is_default && isQuantityInPriceRange(p, quantity)
    );
    
    if (otherMatchingPrice) {
        return otherMatchingPrice;
    }
    
    // Fall back to default price if available
    return defaultPrice ?? activePrices[0];
}

export function getPriceQuantityLabel(price: ItemPrice): string {
    const minQty = price.min_quantity ?? 1;
    const maxQty = price.max_quantity;

    if (maxQty === null || maxQty === undefined) {
        return minQty === 1 ? "(1+)" : `(${minQty}+)`;
    }

    if (minQty === maxQty) {
        return `(${minQty})`;
    }

    return `(${minQty}-${maxQty})`;
}

export function isFlatPriceTier(price: ItemPrice, quantity: number): boolean {
    const minQty = price.min_quantity ?? 1;
    const maxQty = price.max_quantity;

    // Flat price if min = max = quantity (exact match)
    if (maxQty !== null && maxQty !== undefined && maxQty === minQty && quantity === minQty) {
        return true;
    }
    
    return false;
}

export function isQuantityInPriceRange(price: ItemPrice, quantity: number): boolean {
    const minQty = price.min_quantity ?? 1;
    const maxQty = price.max_quantity;

    // If no max quantity, it's a "minQty+" tier, so quantity >= minQty
    if (maxQty === null || maxQty === undefined) {
        return quantity >= minQty;
    }

    // If min = max, it's a flat price tier - only exact match works
    if (maxQty === minQty) {
        return quantity === minQty;
    }

    // Range tier: quantity must be within min-max range
    return quantity >= minQty && quantity <= maxQty;
}

export function calculateTotalPrice(price: ItemPrice | undefined, quantity: number): number {
    if (!price) return 0;
    
    // Check if this is a flat-price tier (exact quantity match)
    if (isFlatPriceTier(price, quantity)) {
        return price.price; // Flat price, not multiplied
    }
    
    return price.price * quantity;
}
