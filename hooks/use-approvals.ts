import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { shiftService } from "@/services/shift.service"
import { stockTakeService } from "@/services/stock-take.service"
import { toast } from "sonner"
import { useAppStore } from "@/store/use-app-store"
import { Shift, SaleCorrection, ExpenseCorrection, CustomerPaymentCorrection, StockTakeCorrection } from "@/types/shift"
import { StockTake } from "@/types/inventory"

export function useApprovals() {
    const queryClient = useQueryClient()
    const { activeShop, userInfo } = useAppStore()

    const isManager = activeShop?.role === "Manager"

    const { data: pendingApprovals, isLoading: isLoadingPending } = useQuery<Shift[]>({
        queryKey: ["pending-approvals", activeShop?.id],
        queryFn: () => shiftService.getPendingApprovalShifts(activeShop!.id),
        enabled: !!activeShop?.id && isManager,
    })

    const { data: rejectedShifts, isLoading: isLoadingRejected } = useQuery<Shift[]>({
        queryKey: ["rejected-shifts", activeShop?.id],
        queryFn: () => shiftService.getRejectedShifts(activeShop!.id, userInfo!.id),
        enabled: !!activeShop?.id && !!userInfo?.id,
    })

    const approveMutation = useMutation({
        mutationFn: (shiftId: string) => {
            console.log(`[approveMutation] calling approveShift shiftId=${shiftId}, userId=${userInfo?.id}`)
            return shiftService.approveShift(shiftId, userInfo!.id)
        },
        onSuccess: () => {
            console.log(`[approveMutation] SUCCESS, invalidating queries`)
            queryClient.invalidateQueries({ queryKey: ["pending-approvals"] })
            queryClient.invalidateQueries({ queryKey: ["rejected-shifts"] })
            queryClient.invalidateQueries({ queryKey: ["current-shift"] })
            toast.success("Shift approved successfully")
        },
        onError: (error: Error) => {
            console.error(`[approveMutation] Error:`, error)
            toast.error(`Failed to approve shift: ${error.message}`)
        },
    })

    const rejectMutation = useMutation({
        mutationFn: ({ shiftId, rejectionReasons }: { shiftId: string; rejectionReasons: Array<{ type: string; message: string; record_id?: string }> }) =>
            shiftService.rejectShift(shiftId, rejectionReasons, userInfo!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pending-approvals"] })
            queryClient.invalidateQueries({ queryKey: ["rejected-shifts"] })
            toast.success("Shift rejected")
        },
        onError: (error: Error) => {
            toast.error(`Failed to reject shift: ${error.message}`)
        },
    })

    const submitForApprovalMutation = useMutation({
        mutationFn: (shiftId: string) => {
            console.log(`[submitForApproval] shiftId=${shiftId}`)
            return shiftService.submitForApproval(shiftId)
        },
        onSuccess: () => {
            console.log(`[submitForApproval] SUCCESS`)
            queryClient.invalidateQueries({ queryKey: ["rejected-shifts"] })
            queryClient.invalidateQueries({ queryKey: ["current-shift"] })
            toast.success("Shift submitted for approval")
        },
        onError: (error: Error) => {
            console.error(`[submitForApproval] Error:`, error)
            toast.error(`Failed to submit shift: ${error.message}`)
        },
    })

    const amendReconciliationMutation = useMutation({
        mutationFn: ({ shiftId, actual_cash_amount, actual_mpesa_amount }: { shiftId: string; actual_cash_amount?: number; actual_mpesa_amount?: number }) =>
            shiftService.amendReconciliation(shiftId, { actual_cash_amount, actual_mpesa_amount }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rejected-shifts"] })
            toast.success("Reconciliation updated")
        },
        onError: (error: Error) => {
            toast.error(`Failed to update reconciliation: ${error.message}`)
        },
    })

    const amendStockTakesMutation = useMutation({
        mutationFn: (data: Partial<StockTake>[]) => {
            console.log(`[amendStockTakes] saving ${data.length} corrections:`, JSON.stringify(data))
            return stockTakeService.createBulkStockTakes(data)
        },
        onSuccess: () => {
            console.log(`[amendStockTakes] SUCCESS`)
            queryClient.invalidateQueries({ queryKey: ["stock-takes"] })
            queryClient.invalidateQueries({ queryKey: ["rejected-shifts"] })
            toast.success("Stock take corrections saved")
        },
        onError: (error: Error) => {
            console.error(`[amendStockTakes] Error:`, error)
            toast.error(`Failed to save stock take corrections: ${error.message}`)
        },
    })

    return {
        pendingApprovals,
        isLoadingPending,
        rejectedShifts,
        isLoadingRejected,
        isManager,
        approve: approveMutation.mutateAsync,
        isApproving: approveMutation.isPending,
        reject: rejectMutation.mutateAsync,
        isRejecting: rejectMutation.isPending,
        submitForApproval: submitForApprovalMutation.mutateAsync,
        isSubmitting: submitForApprovalMutation.isPending,
        amendReconciliation: amendReconciliationMutation.mutateAsync,
        isAmending: amendReconciliationMutation.isPending,
        amendStockTakes: amendStockTakesMutation.mutateAsync,
        isAmendingStockTakes: amendStockTakesMutation.isPending,
    }
}