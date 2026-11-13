import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { shiftService } from "@/services/shift.service"
import { toast } from "sonner"
import { useAppStore } from "@/store/use-app-store"
import { useUser } from "@clerk/nextjs"
import { Shift, ShiftCashMovement, ShiftReconciliation } from "@/types/shift"
import { ListParams } from "@/types/list"

export function useShiftCashMovements(shiftId: string | undefined) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["shift-cash-movements", shiftId],
        queryFn: () => {
            if (!shiftId) return []
            return shiftService.getShiftCashMovements(shiftId)
        },
        enabled: !!shiftId,
    })

    return {
        movements: (data || []) as ShiftCashMovement[],
        isLoading,
        error,
        refetch,
    }
}

export function useReverseCashMovement() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            shiftService.reverseCashMovement(id, reason),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["shift-cash-movements"] })
            await queryClient.invalidateQueries({ queryKey: ["current-shift"] })
            toast.success("Cash movement reversed")
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to reverse cash movement")
        },
    })
}

export function useShift() {
    const queryClient = useQueryClient()
    const { activeShop, userInfo, setActiveShift } = useAppStore()
    const { user } = useUser()

    const { data: currentShift, isLoading } = useQuery<Shift | null>({
        queryKey: ["current-shift", userInfo?.id, activeShop?.id],
        queryFn: () => shiftService.getCurrentShift(userInfo!.id, activeShop!.id),
        enabled: !!userInfo?.id && !!activeShop?.id,
    })

    // Sync with store when data changes
    useEffect(() => {
        if (currentShift !== undefined) {
            setActiveShift(currentShift)
        }
    }, [currentShift, setActiveShift])

    const openShiftMutation = useMutation({
        mutationFn: async (data: { cashAmount: number; mpesaAmount: number }) => {
            if (!activeShop || !userInfo) throw new Error("Shop or User not identified")

            const startTime = new Date()
            return shiftService.openShiftWithOpeningFloat({
                shift: {
                    id: crypto.randomUUID(),
                    name: `Shift ${startTime.toLocaleTimeString()}`,
                    shop_id: activeShop.id,
                    start_time: startTime.toISOString(),
                    end_time: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
                },
                cashAmount: data.cashAmount,
                mpesaAmount: data.mpesaAmount,
            })
        },
        onSuccess: (createdShift) => {
            queryClient.invalidateQueries({ queryKey: ["current-shift"] })
            setActiveShift(createdShift)
            toast.success("Shift opened with opening balances.")
        },
        onError: (error: Error) => {
            toast.error(`Failed to open shift: ${error.message}`)
        },
    })

    const closeShiftMutation = useMutation({
        mutationFn: async (data: { cashAmount: number; mpesaAmount: number }) => {
            if (!currentShift || !userInfo) throw new Error("No active shift found")

            let existingRecon: any = null
            try {
                existingRecon = await shiftService.getShiftReconciliation(currentShift.id)
            } catch (error) {
                if ((error as Error & { status?: number }).status !== 404) throw error
            }
            if (existingRecon) {
                await shiftService.amendReconciliation(currentShift.id, {
                    actual_cash_amount: data.cashAmount,
                    actual_mpesa_amount: data.mpesaAmount,
                    reason: "Cash count updated during shift close",
                    userId: userInfo.id,
                    recordedShiftId: currentShift.id,
                })
            } else {
                await shiftService.createReconciliation({
                    shift_id: currentShift.id,
                    actual_cash_amount: data.cashAmount,
                    actual_mpesa_amount: data.mpesaAmount,
                    status: 'PENDING',
                    created_by: userInfo.id
                })
            }

            return await shiftService.submitForApprovalV2(currentShift.id, userInfo.id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["current-shift"] })
            setActiveShift(null)
            toast.success("Shift submitted for manager approval.")
        },
        onError: (error: Error) => {
            toast.error(`Failed to close shift: ${error.message}`)
        },
    })

    return {
        currentShift,
        isLoading,
        openShift: openShiftMutation.mutateAsync,
        isOpening: openShiftMutation.isPending,
        closeShift: closeShiftMutation.mutateAsync,
        isClosing: closeShiftMutation.isPending,
    }
}
