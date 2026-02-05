import { BaseEntity } from "./common";

export interface User extends BaseEntity {
    name: string;
    email: string;
    clerkId: string;
    last_login?: string | null;
}

export interface Role {
    id: string;
    name: string;
    description?: string | null;
    permissions: string[];
}

export interface Permission {
    id: string;
    description: string;
}
