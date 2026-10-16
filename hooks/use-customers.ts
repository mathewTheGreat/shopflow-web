import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { customerService } from "@/services/customer.service"
import { Customer } from "@/types/customer"
import { ListParams, PagedResult } from "@/types/list"
import { toast } from "sonner"

export function useCustomers() {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["customers"],
        queryFn: () => customerService.getAll(),
        staleTime: 5 * 60 * 1000,
    })

    return {
        customers: data || [],
        isLoading,
        error,
        refetch,
    }
}

export function useCustomersByShop(shopId: string | undefined, params?: ListParams) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["customers", "shop", shopId, params?.search ?? "", params?.page ?? 0, params?.limit ?? 0],
        queryFn: (): Promise<PagedResult<Customer>> => {
            if (!shopId) return Promise.resolve({ data: [], pagination: { page: 1, limit: 0, total: 0, total_pages: 1 } })
            return customerService.getByShop(shopId, params)
        },
        enabled: !!shopId,
        staleTime: 5 * 60 * 1000,
    })

    return {
        customers: data?.data ?? [],
        pagination: data?.pagination,
        isLoading,
        error,
        refetch,
    }
}

export function useCustomerBalance(customerId: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["customer-balance", customerId],
        queryFn: () => customerService.getBalance(customerId),
        enabled: !!customerId,
        staleTime: 0, // Always get fresh balance for POS
    })

    return {
        balance: data?.balance ?? 0,
        isLoading,
        error,
        refetch,
    }
}

export function useCreateCustomer() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: Partial<Customer>) => customerService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] })
            toast.success("Customer created successfully")
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create customer")
        }
    })
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
            customerService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] })
            toast.success("Customer updated successfully")
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update customer")
        }
    })
}

export function useDeleteCustomer() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => customerService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] })
            toast.success("Customer deleted successfully")
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete customer")
        }
    })
}
