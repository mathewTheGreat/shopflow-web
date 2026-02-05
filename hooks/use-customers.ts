import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { customerService } from "@/services/customer.service"
import { Customer } from "@/types/customer"
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

export function useCustomersByShop(shopId: string | undefined) {
    return useQuery({
        queryKey: ["customers", "shop", shopId],
        queryFn: () => {
            if (!shopId) return []
            return customerService.getByShop(shopId)
        },
        enabled: !!shopId,
        staleTime: 5 * 60 * 1000,
    })
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
