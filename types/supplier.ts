import { BaseEntity } from "./common";

export interface Supplier extends BaseEntity {
    name: string;
    contact?: string | null;
    email?: string | null;
    shop_id?: string | null;
    phone?: string | null;
    created_by?: string | null;
}
