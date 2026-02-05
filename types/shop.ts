import { z } from "zod"
import { BaseEntity } from "./common";

export const createShopSchema = z.object({
    name: z.string().min(1, "Shop name is required").max(100, "Shop name must be less than 100 characters"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    is_main_shop: z.boolean().default(false),
})

export type CreateShopInput = z.infer<typeof createShopSchema>

export interface Shop extends BaseEntity {
    name: string;
    address: string;
    city: string;
    is_main_shop: boolean;
    created_by?: string | null;
}

export interface ShopStaff extends BaseEntity {
    user_id: string;
    shop_id: string;
    role_id: string;
    created_by?: string | null;
}
