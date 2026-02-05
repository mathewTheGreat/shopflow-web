import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { shiftService } from "@/services/shift.service"
import { toast } from "sonner"
import { useAppStore } from "@/store/use-app-store"
import { useUser } from "@clerk/nextjs"
import { Shift, ShiftCashMovement, ShiftReconciliation } from "@/types/shift"

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

            const newShift: any = await shiftService.createShift({
                name: `Shift ${new Date().toLocaleTimeString()}`,
                shop_id: activeShop.id,
                manager_id: userInfo.id,
                start_time: new Date().toISOString(),
                end_time: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
                is_closed: false,
            })

            if (data.cashAmount > 0) {
                await shiftService.recordCashMovement({
                    shift_id: newShift[0].id,
                    type: 'FLOAT_IN',
                    amount: data.cashAmount,
                    payment_method: 'CASH',
                    reason: 'Initial Shift Opening Float - CASH',
                    created_by: userInfo.id
                })
            }

            if (data.mpesaAmount > 0) {
                await shiftService.recordCashMovement({
                    shift_id: newShift[0].id,
                    type: 'FLOAT_IN',
                    amount: data.mpesaAmount,
                    payment_method: 'MPESA',
                    reason: 'Initial Shift Opening Float - MPESA',
                    created_by: userInfo.id
                })
            }

            return newShift
        },
        onSuccess: (newShift) => {
            queryClient.invalidateQueries({ queryKey: ["current-shift"] })
            setActiveShift(newShift)
            toast.success("Shift opened successfully with initial float.")
        },
        onError: (error: Error) => {
            toast.error(`Failed to open shift: ${error.message}`)
        },
    })

    const closeShiftMutation = useMutation({
        mutationFn: async (data: { cashAmount: number; mpesaAmount: number }) => {
            if (!currentShift || !userInfo) throw new Error("No active shift found")

            await shiftService.createReconciliation({
                shift_id: currentShift.id,
                actual_cash_amount: data.cashAmount,
                actual_mpesa_amount: data.mpesaAmount,
                status: 'PENDING',
                created_by: userInfo.id
            })

            return await shiftService.closeShiftRecord(currentShift.id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["current-shift"] })
            setActiveShift(null)
            toast.success("Shift closed successfully. Reconciliation initiated.")
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
