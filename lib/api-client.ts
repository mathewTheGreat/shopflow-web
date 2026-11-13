type FetchOptions = RequestInit & {
    headers?: Record<string, string>
}

let apiTokenGetter: (() => Promise<string | null>) | undefined
let requestSequence = 0

export function setApiTokenGetter(getter: () => Promise<string | null>) {
    apiTokenGetter = getter
}

function authFlowRoute(url: string): string | null {
    const path = new URL(url, "http://localhost").pathname
    if (/\/api\/items\/?$/.test(path)) return "/api/items"
    if (/\/api\/users\/clerk\/[^/]+\/?$/.test(path)) return "/api/users/clerk/:clerkId"
    if (/\/api\/shop-staff\/user\/[^/]+\/?$/.test(path)) return "/api/shop-staff/user/:userId"
    return null
}

async function fetcher<T>(url: string, options?: FetchOptions): Promise<T> {
    const method = options?.method || "GET"
    const route = authFlowRoute(url)
    const traceId = route ? `auth-${Date.now()}-${++requestSequence}` : undefined
    let token: string | null | undefined
    try {
        token = await apiTokenGetter?.()
    } catch (error) {
        if (route) {
            console.error("[AuthFlow] Failed to obtain Clerk token", {
                traceId,
                route,
                method,
                message: error instanceof Error ? error.message : String(error)
            })
        }
        throw error
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(options?.headers as Record<string, string> | undefined),
    }
    if (traceId) headers["X-Auth-Flow-Id"] = traceId
    if (token && !headers.Authorization && !headers.authorization) {
        headers.Authorization = `Bearer ${token}`
    }

    if (route) {
        console.info("[AuthFlow] API request", {
            traceId,
            route,
            method,
            tokenGetterReady: Boolean(apiTokenGetter),
            tokenPresent: Boolean(token)
        })
    }

    let response: Response
    try {
        response = await fetch(url, {
            ...options,
            headers,
        })
    } catch (error) {
        if (route) {
            console.error("[AuthFlow] API request failed before response", {
                traceId,
                route,
                method,
                message: error instanceof Error ? error.message : String(error)
            })
        }
        throw error
    }

    if (route) {
        console.info("[AuthFlow] API response", {
            traceId,
            route,
            method,
            status: response.status,
            ok: response.ok
        })
    }

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
    post: <T>(url: string, data?: unknown, options?: FetchOptions) => {
        console.log(`[API Client] POST ${url}`, data);
        return fetcher<T>(process.env.NEXT_PUBLIC_API_URL + url, {
            ...options,
            method: "POST",
            body: data === undefined ? undefined : JSON.stringify(data),
        });
    },
    put: <T>(url: string, data?: unknown, options?: FetchOptions) => {
        console.log(`[API Client] PUT ${url}`, data);
        return fetcher<T>(process.env.NEXT_PUBLIC_API_URL + url, {
            ...options,
            method: "PUT",
            body: data === undefined ? undefined : JSON.stringify(data),
        });
    },
    patch: <T>(url: string, data?: unknown, options?: FetchOptions) => {
        console.log(`[API Client] PATCH ${url}`, data);
        return fetcher<T>(process.env.NEXT_PUBLIC_API_URL + url, {
            ...options,
            method: "PATCH",
            body: data === undefined ? undefined : JSON.stringify(data),
        });
    },
    delete: <T>(url: string, data?: unknown, options?: FetchOptions) => {
        console.log(`[API Client] DELETE ${url}`, data);
        return fetcher<T>(process.env.NEXT_PUBLIC_API_URL + url, {
            ...options,
            method: "DELETE",
            body: data ? JSON.stringify(data) : undefined,
        });
    },
}
