export interface ListParams {
    search?: string
    page?: number
    limit?: number
}

export interface PaginationInfo {
    page: number
    limit: number
    total: number
    total_pages: number
}

export interface PagedResult<T> {
    data: T[]
    pagination: PaginationInfo
}

export function buildListQuery(params?: ListParams): string {
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.set("search", params.search)
    if (params?.page) queryParams.set("page", params.page.toString())
    if (params?.limit) queryParams.set("limit", params.limit.toString())
    const queryString = queryParams.toString()
    return queryString ? `?${queryString}` : ""
}
