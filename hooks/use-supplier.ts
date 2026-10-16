import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supplierService } from "@/services/supplier.service"
import { toast } from "sonner"
import { Supplier } from "@/types/supplier"
import { ListParams } from "@/types/list"

export function useSuppliers(params?: ListParams) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["suppliers", params?.search ?? "", params?.page ?? 0, params?.limit ?? 0],
        queryFn: () => supplierService.getSuppliers(params),
    })

    return {
        suppliers: data?.data ?? [],
        pagination: data?.pagination,
        isLoading,
        error,
        refetch,
    }
}

export function useSupplier(id: string) {
    return useQuery({
        queryKey: ["supplier", id],
        queryFn: () => supplierService.getSupplier(id),
        enabled: !!id,
    })
}

export function useCreateSupplier() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: supplierService.createSupplier,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] })
            toast.success("Supplier created successfully")
        },
        onError: (error: Error) => {
            toast.error(`Failed to create supplier: ${error.message}`)
        },
    })
}

export function useUpdateSupplier() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) =>
            supplierService.updateSupplier(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] })
            queryClient.invalidateQueries({ queryKey: ["supplier", variables.id] })
            toast.success("Supplier updated successfully")
        },
        onError: (error: Error) => {
            toast.error(`Failed to update supplier: ${error.message}`)
        },
    })
}

export function useDeleteSupplier() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: supplierService.deleteSupplier,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] })
            toast.success("Supplier deleted successfully")
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete supplier: ${error.message}`)
        },
    })
}
