import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { shiftService } from "@/services/shift.service"
import { toast } from "sonner"

export interface FloatSimulation {
    targetShift: { id: string; start_time: string; shop_id: string }
    requestedAmount: number
    availableSources: Array<{ shift_id: string; available_cash: number }>
    totalAvailable: number
    canFulfill: boolean
    proposedAllocations: Array<{ shift_id: string; amount: number }>
}

export interface FloatSource {
    shift_id: string
    available_cash: number
    shift_start_time?: string
}

export function useFloatSources(shopId: string | undefined, shiftStartTime: string | undefined) {
    return useQuery({
        queryKey: ["float-sources", shopId, shiftStartTime],
        queryFn: () => {
            if (!shopId || !shiftStartTime) return null
            return shiftService.getFloatSources(shopId, shiftStartTime)
        },
        enabled: !!shopId && !!shiftStartTime,
    })
}

export function useSimulateFloatAllocation() {
    return useMutation({
        mutationFn: (data: { shiftId: string; amount: number }) =>
            shiftService.simulateFloatAllocation(data),
        onError: (error: Error) => {
            toast.error(`Simulation failed: ${error.message}`)
        },
    })
}

export function useAllocateFloat() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: {
            targetShiftId: string;
            amount: number;
            paymentMethod: string;
            reason?: string;
        }) => shiftService.allocateFloat(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["current-shift"] })
            queryClient.invalidateQueries({ queryKey: ["float-sources"] })
            queryClient.invalidateQueries({ queryKey: ["shift-cash-movements"] })
            toast.success("Float allocated successfully")
        },
        onError: (error: Error) => {
            toast.error(`Failed to allocate float: ${error.message}`)
        },
    })
}
