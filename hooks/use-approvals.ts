import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { shiftService } from "@/services/shift.service"
import { toast } from "sonner"
import { useAppStore } from "@/store/use-app-store"
import { Shift } from "@/types/shift"

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
        queryKey: ["rejected-shifts-v2", activeShop?.id],
        queryFn: () => shiftService.getRejectedShiftsV2(activeShop!.id),
        enabled: !!activeShop?.id,
    })

    // V2: Immutable approval mutations
    const approveV2Mutation = useMutation({
        mutationFn: (shiftId: string) => {
            return shiftService.approveShiftV2(shiftId, userInfo!.id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pending-approvals"] })
            queryClient.invalidateQueries({ queryKey: ["rejected-shifts-v2"] })
            queryClient.invalidateQueries({ queryKey: ["current-shift"] })
            toast.success("Shift approved successfully")
        },
        onError: (error: Error) => {
            toast.error(`Failed to approve shift: ${error.message}`)
        },
    })

    const rejectV2Mutation = useMutation({
        mutationFn: ({ shiftId, reason }: { shiftId: string; reason: string }) =>
            shiftService.rejectShiftV2(shiftId, reason, userInfo!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pending-approvals"] })
            queryClient.invalidateQueries({ queryKey: ["rejected-shifts-v2"] })
            toast.success("Shift rejected")
        },
        onError: (error: Error) => {
            toast.error(`Failed to reject shift: ${error.message}`)
        },
    })

    const submitForApprovalV2Mutation = useMutation({
        mutationFn: (shiftId: string) => {
            return shiftService.submitForApprovalV2(shiftId, userInfo!.id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rejected-shifts-v2"] })
            queryClient.invalidateQueries({ queryKey: ["current-shift"] })
            toast.success("Shift submitted for approval")
        },
        onError: (error: Error) => {
            toast.error(`Failed to submit shift: ${error.message}`)
        },
    })

    const approveRejectedShiftV2Mutation = useMutation({
        mutationFn: (shiftId: string) => {
            return shiftService.approveRejectedShiftV2(shiftId, userInfo!.id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rejected-shifts-v2"] })
            queryClient.invalidateQueries({ queryKey: ["pending-approvals"] })
            queryClient.invalidateQueries({ queryKey: ["current-shift"] })
            toast.success("Rejected shift approved successfully")
        },
        onError: (error: Error) => {
            toast.error(`Failed to approve rejected shift: ${error.message}`)
        },
    })

    return {
        // Data
        pendingApprovals,
        isLoadingPending,
        rejectedShifts,
        isLoadingRejected,
        isManager,

        // V2: Immutable approval
        approveV2: approveV2Mutation.mutateAsync,
        isApprovingV2: approveV2Mutation.isPending,
        rejectV2: rejectV2Mutation.mutateAsync,
        isRejectingV2: rejectV2Mutation.isPending,
        submitForApprovalV2: submitForApprovalV2Mutation.mutateAsync,
        isSubmittingV2: submitForApprovalV2Mutation.isPending,

        approveRejectedShiftV2: approveRejectedShiftV2Mutation.mutateAsync,
        isApprovingRejectedShiftV2: approveRejectedShiftV2Mutation.isPending,
    }
}