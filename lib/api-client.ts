type FetchOptions = RequestInit & {
    headers?: Record<string, string>
}

async function fetcher<T>(url: string, options?: FetchOptions): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
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
            // If body is not JSON, try to get text to see what happened
            try {
                const text = await response.text()
                console.error(`[API Client] Non-JSON error response from ${url}:`, text.slice(0, 500))
            } catch (textErr) {
                // Ignore text parse errors
            }
        }
        const error = new Error(errorMessage) as Error & { status: number }
        error.status = response.status
        throw error
    }

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
        return {} as T
    }

    try {
        return await response.json()
    } catch (jsonErr) {
        // Clone response to read text if json fails
        const text = await response.text()
        console.error(`[API Client] Failed to parse JSON response from ${url}. Body snippet:`, text.slice(0, 1000))
        throw jsonErr
    }
}

export const apiClient = {
    get: <T>(url: string, options?: FetchOptions) => fetcher<T>(process.env.NEXT_PUBLIC_API_URL + url, { ...options, method: "GET" }),
    post: <T>(url: string, data: unknown, options?: FetchOptions) => {
        console.log(`[API Client] POST ${url}`, data);
        return fetcher<T>(process.env.NEXT_PUBLIC_API_URL + url, {
            ...options,
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    put: <T>(url: string, data: unknown, options?: FetchOptions) => {
        console.log(`[API Client] PUT ${url}`, data);
        return fetcher<T>(process.env.NEXT_PUBLIC_API_URL + url, {
            ...options,
            method: "PUT",
            body: JSON.stringify(data),
        });
    },
    patch: <T>(url: string, data: unknown, options?: FetchOptions) => {
        console.log(`[API Client] PATCH ${url}`, data);
        return fetcher<T>(process.env.NEXT_PUBLIC_API_URL + url, {
            ...options,
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },
    delete: <T>(url: string, options?: FetchOptions) => fetcher<T>(process.env.NEXT_PUBLIC_API_URL + url, { ...options, method: "DELETE" }),
}
