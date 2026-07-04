"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Loader2, ChevronRight, Check, X, AlertTriangle } from "lucide-react"
import { useAppStore } from "@/store/use-app-store"
import { useApprovals } from "@/hooks/use-approvals"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"
import { AppSidebar } from "@/components/app-sidebar"
import { Shift } from "@/types/shift"

function formatDateTime(isoString?: string | null) {
    if (!isoString) return ""
    return new Date(isoString).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })
}

function formatDuration(start?: string, end?: string) {
    if (!start || !end) return ""
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    const diff = Math.max(0, e - s)
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    return `${hours}h ${minutes}m`
}

function RejectDialog({
    open,
    onClose,
    onConfirm,
    isLoading,
}: {
    open: boolean
    onClose: () => void
    onConfirm: (reason: string) => void
    isLoading: boolean
}) {
    const [reason, setReason] = useState("")

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
                <h3 className="text-lg font-bold mb-2">Reject Shift</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Provide a reason for rejection. The cashier will see this and record corrections from their current shift.
                </p>
                <Label htmlFor="reject-reason">Reason</Label>
                <Textarea
                    id="reject-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Cash count mismatch, missing stock take..."
                    className="mt-1 mb-4"
                    rows={3}
                />
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button
                        variant="destructive"
                        onClick={() => onConfirm(reason)}
                        disabled={!reason.trim() || isLoading}
                    >
                        {isLoading ? "Rejecting..." : "Reject"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

function ManagerApprovalView({
    shift,
    onApprove,
    onReject,
    isApproving,
    isRejecting,
}: {
    shift: Shift
    onApprove: () => void
    onReject: (reason: string) => void
    isApproving: boolean
    isRejecting: boolean
}) {
    const [showReject, setShowReject] = useState(false)
    const [expanded, setExpanded] = useState(false)

    return (
        <Card className="bg-card border shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{shift.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatDateTime(shift.submitted_for_approval_at)} &middot; {formatDateTime(shift.start_time)} - {formatDateTime(shift.end_time)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Duration: {formatDuration(shift.start_time, shift.end_time)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            size="sm"
                            variant="default"
                            onClick={onApprove}
                            disabled={isApproving}
                        >
                            {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                            Approve
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setShowReject(true)}
                            disabled={isRejecting}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                        </Button>
                    </div>
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                    <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
                    {expanded ? "Hide details" : "View details"}
                </button>
                {expanded && (
                    <div className="mt-3 pt-3 border-t text-sm space-y-1 text-muted-foreground">
                        <p><strong>Shift:</strong> {shift.name}</p>
                        <p><strong>Cashier:</strong> {shift.manager_name || shift.manager_id.slice(0, 8)}</p>
                    </div>
                )}
            </CardContent>
            <RejectDialog
                open={showReject}
                onClose={() => setShowReject(false)}
                onConfirm={(reason) => {
                    onReject(reason)
                    setShowReject(false)
                }}
                isLoading={isRejecting}
            />
        </Card>
    )
}

function RejectedShiftCard({ shift, onApprove, isApproving }: { shift: Shift; onApprove?: () => void; isApproving?: boolean }) {
    return (
        <Card className="bg-card border shadow-sm">
            <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                    <div>
                        <p className="font-bold text-sm">Shift Rejected (Closed)</p>
                        <p className="text-xs text-muted-foreground">{shift.rejection_reason}</p>
                    </div>
                </div>

                <div className="bg-muted/30 rounded-md p-3 text-xs space-y-1">
                    <p><strong>Shift:</strong> {shift.name}</p>
                    <p><strong>Started:</strong> {formatDateTime(shift.start_time)}</p>
                    <p><strong>Ended:</strong> {formatDateTime(shift.end_time)}</p>
                    <p><strong>Duration:</strong> {formatDuration(shift.start_time, shift.end_time)}</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                        Corrections are recorded from the cashier's dashboard. Once all corrections are complete, click approve below.
                    </p>
                </div>

                {onApprove && (
                    <Button
                        variant="default"
                        className="w-full h-12 text-sm font-medium"
                        onClick={onApprove}
                        disabled={isApproving}
                    >
                        <Check className="h-4 w-4 mr-2" />
                        {isApproving ? "Approving..." : "Approve Shift (Mark as Corrected)"}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

export default function ApprovalsPage() {
    const { user, isLoaded } = useUser()
    const { activeShop, userInfo } = useAppStore()
    const {
        pendingApprovals,
        isLoadingPending,
        rejectedShifts,
        isLoadingRejected,
        isManager,
        approveV2,
        isApprovingV2,
        rejectV2,
        isRejectingV2,
        approveRejectedShiftV2,
        isApprovingRejectedShiftV2,
    } = useApprovals()

    const [selectedTab, setSelectedTab] = useState<"pending" | "rejected">("pending")

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
            <div className="hidden md:block w-80 border-r border-border bg-card sticky top-0 h-screen overflow-y-auto">
                <AppSidebar />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-card border-b border-border/50 md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="mr-4">
                                <span className="sr-only">Menu</span>
                                <span className="h-6 w-6">☰</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] p-0 border-r-border bg-card">
                            <AppSidebar />
                        </SheetContent>
                    </Sheet>
                    <h1 className="text-xl font-bold tracking-tight">Approvals</h1>
                </header>

                <header className="hidden md:flex items-center h-[64px] px-6 bg-card border-b border-border/50 sticky top-0 z-30">
                    <div className="pl-[44px]">
                        <h1 className="text-xl font-bold tracking-tight">Approvals</h1>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 lg:p-12 w-full mx-auto overflow-y-auto scrollbar-hide">
                    <div className="max-w-[800px] mx-auto space-y-6">
                        {/* Tabs */}
                        <div className="flex gap-1 bg-muted/30 rounded-lg p-1 w-fit">
                            <button
                                onClick={() => setSelectedTab("pending")}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedTab === "pending" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {isManager ? "Pending Approval" : "All Shifts"}
                            </button>
                            <button
                                onClick={() => setSelectedTab("rejected")}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedTab === "rejected" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                Rejected
                            </button>
                        </div>

                        {selectedTab === "pending" && isManager && (
                            <div className="space-y-3">
                                <h2 className="text-lg font-bold">Pending Approval</h2>
                                {isLoadingPending ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : !pendingApprovals?.length ? (
                                    <p className="text-sm text-muted-foreground text-center py-12">No shifts pending approval</p>
                                ) : (
                                    pendingApprovals.map((shift) => (
                                        <ManagerApprovalView
                                            key={shift.id}
                                            shift={shift}
                                            onApprove={() => approveV2(shift.id)}
                                            onReject={(reason) => rejectV2({ shiftId: shift.id, reason })}
                                            isApproving={isApprovingV2}
                                            isRejecting={isRejectingV2}
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        {selectedTab === "pending" && !isManager && (
                            <div className="space-y-3">
                                <h2 className="text-lg font-bold">Your Shifts</h2>
                                {isLoadingRejected ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : !rejectedShifts?.length ? (
                                    <p className="text-sm text-muted-foreground text-center py-12">No shifts found</p>
                                ) : (
                                    rejectedShifts.map((shift) => (
                                        <RejectedShiftCard key={shift.id} shift={shift} onApprove={isManager ? () => approveRejectedShiftV2(shift.id) : undefined} isApproving={isApprovingRejectedShiftV2} />
                                    ))
                                )}
                            </div>
                        )}

                        {selectedTab === "rejected" && (
                            <div className="space-y-3">
                                <h2 className="text-lg font-bold">Rejected Shifts</h2>
                                {isLoadingRejected ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : !rejectedShifts?.length ? (
                                    <p className="text-sm text-muted-foreground text-center py-12">No rejected shifts</p>
                                ) : (
                                    rejectedShifts.map((shift) => (
                                        <RejectedShiftCard key={shift.id} shift={shift} onApprove={isManager ? () => approveRejectedShiftV2(shift.id) : undefined} isApproving={isApprovingRejectedShiftV2} />
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}