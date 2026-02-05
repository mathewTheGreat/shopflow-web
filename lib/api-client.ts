type FetchOptions = RequestInit & {
    headers?: Record<string, string>
}

async function fetcher<T>(url: string, options?: FetchOptions): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    })

    if (!response.ok) {
        // Try to parse error message from JSON, fallback to status text
        let errorMessage = response.statusText
        try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
            // Ignore JSON parse error if response body is not JSON
        }
        const error = new Error(errorMessage) as Error & { status: number }
        error.status = response.status
        throw error
    }

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
        return {} as T
    }

    return response.json()
}

export const apiClient = {
    get: <T>(url: string, options?: FetchOptions) => fetcher<T>(process.env.NEXT_PUBLIC_API_URL + url, { ...options, method: "GET" }),
    post: <T>(url: string, data: unknown, options?: FetchOptions) =>
        fetcher<T>(process.env.NEXT_PUBLIC_API_URL + url, {
            ...options,
            method: "POST",
            body: JSON.stringify(data),
        }),
    put: <T>(url: string, data: unknown, options?: FetchOptions) =>
        fetcher<T>(process.env.NEXT_PUBLIC_API_URL + url, {
            ...options,
            method: "PUT",
            body: JSON.stringify(data),
        }),
    patch: <T>(url: string, data: unknown, options?: FetchOptions) =>
        fetcher<T>(process.env.NEXT_PUBLIC_API_URL + url, {
            ...options,
            method: "PATCH",
            body: JSON.stringify(data),
        }),
    delete: <T>(url: string, options?: FetchOptions) => fetcher<T>(process.env.NEXT_PUBLIC_API_URL + url, { ...options, method: "DELETE" }),
}
