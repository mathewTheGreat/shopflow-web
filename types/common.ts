export interface BaseEntity {
    id: string;
    created_at?: string | null;
    _version: number;
    _last_modified_at: string;
    _is_pending: boolean;
    _synced_at?: string | null;
}
