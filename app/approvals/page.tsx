"use client"

import { useState, useMemo } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Loader2, ChevronRight, Check, X, ArrowLeft, AlertTriangle, DollarSign, Package, Search } from "lucide-react"
import { useAppStore } from "@/store/use-app-store"
import { useApprovals } from "@/hooks/use-approvals"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"
import { AppSidebar } from "@/components/app-sidebar"
import { Shift } from "@/types/shift"
import { StockTake } from "@/types/inventory"
import { stockTakeService } from "@/services/stock-take.service"
import { itemService, Item } from "@/services/item.service"

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
                    Provide a reason for rejection. The cashier will see this when amending.
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
                        <p><strong>Shift ID:</strong> {shift.id}</p>
                        <p><strong>Manager/Cashier ID:</strong> {shift.manager_id}</p>
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

function AmendShiftForm({
    shift,
    onAmendFinancials,
    onSubmitForApproval,
    onAmendStockTakes,
    isAmending,
    isSubmitting,
    isAmendingStockTakes,
}: {
    shift: Shift
    onAmendFinancials: (data: { actual_cash_amount?: number; actual_mpesa_amount?: number }) => void
    onSubmitForApproval: () => void
    onAmendStockTakes: (data: Partial<StockTake>[]) => void
    isAmending: boolean
    isSubmitting: boolean
    isAmendingStockTakes: boolean
}) {
    const [cash, setCash] = useState("")
    const [mpesa, setMpesa] = useState("")
    const [stockSearch, setStockSearch] = useState("")
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [corrections, setCorrections] = useState<Record<string, string>>({})

    const { data: stockTakes, isLoading: isLoadingStockTakes } = useQuery({
        queryKey: ["stock-takes", shift.id],
        queryFn: () => stockTakeService.getStockTakesByShift(shift.id),
        enabled: !!shift.id,
    })

    const { data: allItems } = useQuery({
        queryKey: ["items"],
        queryFn: () => itemService.getAll(),
    })

    const itemMap = useMemo(() => {
        if (!allItems) return new Map<string, Item>()
        const map = new Map<string, Item>()
        for (const item of allItems) {
            map.set(item.id, item)
        }
        return map
    }, [allItems])

    const filteredStockTakes = useMemo(() => {
        if (!stockTakes) return []
        if (!stockSearch.trim()) return stockTakes
        const lower = stockSearch.toLowerCase()
        return stockTakes.filter((st) => {
            const name = itemMap.get(st.item_id)?.name?.toLowerCase() || st.item_id
            return name.includes(lower)
        })
    }, [stockTakes, stockSearch, itemMap])

    function toggleSelect(itemId: string) {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(itemId)) {
                next.delete(itemId)
                setCorrections((c) => {
                    const copy = { ...c }
                    delete copy[itemId]
                    return copy
                })
            } else {
                next.add(itemId)
                const st = stockTakes?.find((s) => s.item_id === itemId)
                if (st) {
                    setCorrections((c) => ({ ...c, [itemId]: String(st.counted_qty) }))
                }
            }
            return next
        })
    }

    function handleSaveStockCorrections() {
        const entries = Array.from(selected)
            .map((itemId) => {
                const val = corrections[itemId]
                if (!val || val.trim() === "") return null
                const corrected = parseFloat(val)
                if (isNaN(corrected)) return null
                const original = stockTakes?.find((st) => st.item_id === itemId)
                return {
                    item_id: itemId,
                    shop_id: shift.shop_id,
                    shift_id: shift.id,
                    expected_qty: original?.expected_qty ?? 0,
                    counted_qty: corrected,
                    variance: corrected - (original?.expected_qty ?? 0),
                    notes: original?.notes,
                    is_adjusted: false,
                }
            })
            .filter(Boolean) as Partial<StockTake>[]

        if (entries.length === 0) return
        console.log("[AmendShiftForm] Saving stock corrections:", JSON.stringify(entries))
        onAmendStockTakes(entries)
    }

    return (
        <Card className="bg-card border shadow-sm">
            <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                    <div>
                        <p className="font-bold text-sm">Shift Rejected</p>
                        <p className="text-xs text-muted-foreground">{shift.rejection_reason}</p>
                    </div>
                </div>

                <div className="bg-muted/30 rounded-md p-3 text-xs space-y-1">
                    <p><strong>Shift:</strong> {shift.name}</p>
                    <p><strong>Started:</strong> {formatDateTime(shift.start_time)}</p>
                    <p><strong>Ended:</strong> {formatDateTime(shift.end_time)}</p>
                    <p><strong>Duration:</strong> {formatDuration(shift.start_time, shift.end_time)}</p>
                </div>

                <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <h4 className="font-bold text-sm">Actual Amounts</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="amend-cash">Actual Cash (KES)</Label>
                            <Input
                                id="amend-cash"
                                type="number"
                                value={cash}
                                onChange={(e) => setCash(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <Label htmlFor="amend-mpesa">Actual M-Pesa (KES)</Label>
                            <Input
                                id="amend-mpesa"
                                type="number"
                                value={mpesa}
                                onChange={(e) => setMpesa(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() =>
                            onAmendFinancials({
                                actual_cash_amount: cash ? parseFloat(cash) : undefined,
                                actual_mpesa_amount: mpesa ? parseFloat(mpesa) : undefined,
                            })
                        }
                        disabled={isAmending || (!cash && !mpesa)}
                    >
                        {isAmending ? "Saving..." : "Save Amounts"}
                    </Button>
                </div>

                <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Package className="h-4 w-4 text-primary" />
                        <h4 className="font-bold text-sm">Stock Take</h4>
                    </div>

                    {isLoadingStockTakes ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : !stockTakes?.length ? (
                        <p className="text-xs text-muted-foreground">No stock takes recorded for this shift.</p>
                    ) : (
                        <div className="space-y-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={stockSearch}
                                    onChange={(e) => setStockSearch(e.target.value)}
                                    placeholder="Search items..."
                                    className="pl-8 h-9 text-sm"
                                />
                            </div>

                            <div className="max-h-72 overflow-y-auto border rounded-md">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/30 sticky top-0">
                                        <tr className="text-left text-muted-foreground">
                                            <th className="p-2 w-8"></th>
                                            <th className="p-2">Item</th>
                                            <th className="p-2 text-right">Expected</th>
                                            <th className="p-2 text-right">Counted</th>
                                            <th className="p-2 text-right">Variance</th>
                                            <th className="p-2 text-right" colSpan={selected.size > 0 ? 1 : 0}>Corrected</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStockTakes.length === 0 && stockSearch.trim() && (
                                            <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No items match your search</td></tr>
                                        )}
                                        {filteredStockTakes.map((st) => {
                                            const itemName = itemMap.get(st.item_id)?.name || st.item_id.slice(0, 8)
                                            const isSelected = selected.has(st.item_id)
                                            const correctedVal = corrections[st.item_id] ?? ""
                                            const variance = st.counted_qty - st.expected_qty
                                            return (
                                                <tr
                                                    key={st.item_id}
                                                    className={`border-t border-border/50 cursor-pointer hover:bg-muted/20 ${isSelected ? "bg-primary/5" : ""}`}
                                                    onClick={() => toggleSelect(st.item_id)}
                                                >
                                                    <td className="p-2 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleSelect(st.item_id)}
                                                            className="accent-primary"
                                                        />
                                                    </td>
                                                    <td className="p-2 font-medium truncate max-w-[120px]">{itemName}</td>
                                                    <td className="p-2 text-right">{st.expected_qty}</td>
                                                    <td className="p-2 text-right">{st.counted_qty}</td>
                                                    <td className={`p-2 text-right font-medium ${variance === 0 ? "" : variance > 0 ? "text-green-600" : "text-red-600"}`}>
                                                        {variance > 0 ? "+" : ""}{variance}
                                                    </td>
                                                    <td className="p-2 text-right">
                                                        {isSelected && (
                                                            <Input
                                                                type="number"
                                                                value={correctedVal}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) =>
                                                                    setCorrections((prev) => ({
                                                                        ...prev,
                                                                        [st.item_id]: e.target.value,
                                                                    }))
                                                                }
                                                                className="w-20 h-7 text-xs text-right inline-block"
                                                                step="any"
                                                            />
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={handleSaveStockCorrections}
                                disabled={isAmendingStockTakes || selected.size === 0}
                            >
                                {isAmendingStockTakes
                                    ? "Saving..."
                                    : `Save Corrections${selected.size > 0 ? ` (${selected.size})` : ""}`}
                            </Button>
                        </div>
                    )}
                </div>

                <Button
                    className="w-full"
                    onClick={onSubmitForApproval}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Submitting..." : "Submit for Approval"}
                </Button>
            </CardContent>
        </Card>
    )
}

export default function ApprovalsPage() {
    const { user, isLoaded } = useUser()
    const router = useRouter()
    const { activeShop, userInfo } = useAppStore()
    const {
        pendingApprovals,
        isLoadingPending,
        rejectedShifts,
        isLoadingRejected,
        isManager,
        approve,
        isApproving,
        reject,
        isRejecting,
        submitForApproval,
        isSubmitting,
        amendReconciliation,
        isAmending,
        amendStockTakes,
        isAmendingStockTakes,
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
                                            onApprove={() => approve(shift.id)}
                                            onReject={(reason) => reject({ shiftId: shift.id, reason })}
                                            isApproving={isApproving}
                                            isRejecting={isRejecting}
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
                                        <AmendShiftForm
                                            key={shift.id}
                                            shift={shift}
                                            onAmendFinancials={(data) =>
                                                amendReconciliation({ shiftId: shift.id, ...data })
                                            }
                                            onSubmitForApproval={() => submitForApproval(shift.id)}
                                            onAmendStockTakes={(data) => amendStockTakes(data)}
                                            isAmending={isAmending}
                                            isSubmitting={isSubmitting}
                                            isAmendingStockTakes={isAmendingStockTakes}
                                        />
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
                                        <AmendShiftForm
                                            key={shift.id}
                                            shift={shift}
                                            onAmendFinancials={(data) =>
                                                amendReconciliation({ shiftId: shift.id, ...data })
                                            }
                                            onSubmitForApproval={() => submitForApproval(shift.id)}
                                            onAmendStockTakes={(data) => amendStockTakes(data)}
                                            isAmending={isAmending}
                                            isSubmitting={isSubmitting}
                                            isAmendingStockTakes={isAmendingStockTakes}
                                        />
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