"use client"

import { useState, useMemo, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Loader2, ChevronRight, Check, X, AlertTriangle, DollarSign, Package, Plus, ChevronsUpDown, CheckIcon } from "lucide-react"
import { toast } from "sonner"
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
import { Shift, ShiftCashMovement, ShiftReconciliation } from "@/types/shift"
import { StockTake } from "@/types/inventory"
import { stockTakeService } from "@/services/stock-take.service"
import { itemService, Item } from "@/services/item.service"
import { shiftService } from "@/services/shift.service"
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

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
    const [startingCash, setStartingCash] = useState("")
    const [startingMpesa, setStartingMpesa] = useState("")
    const [isSavingStartingFloats, setIsSavingStartingFloats] = useState(false)
    const [comboboxOpen, setComboboxOpen] = useState(false)
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState("")
    const [pendingCorrections, setPendingCorrections] = useState<Map<string, { name: string; correctedQty: number }>>(new Map())

    const { data: stockTakes, isLoading: isLoadingStockTakes } = useQuery({
        queryKey: ["stock-takes", shift.id],
        queryFn: () => stockTakeService.getStockTakesByShift(shift.id),
        enabled: !!shift.id,
    })

    const { data: cashMovements, refetch: refetchCashMovements } = useQuery({
        queryKey: ["cash-movements", shift.id],
        queryFn: () => shiftService.getShiftCashMovements(shift.id),
        enabled: !!shift.id,
    })

    const { data: reconciliation } = useQuery({
        queryKey: ["reconciliation", shift.id],
        queryFn: () => shiftService.getShiftReconciliation(shift.id),
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

    const selectedStockTake = useMemo(() => {
        if (!selectedItemId || !stockTakes) return null
        return stockTakes.find((st) => st.item_id === selectedItemId) ?? null
    }, [selectedItemId, stockTakes])

    const startingFloats = useMemo(() => {
        if (!cashMovements) return { cash: null as ShiftCashMovement | null, mpesa: null as ShiftCashMovement | null }
        const cashFloat = cashMovements
            .filter(m => m.type === "FLOAT_IN" && m.payment_method === "CASH")
            .sort((a, b) => ((a.created_at) || "").localeCompare((b.created_at) || ""))[0]
        const mpesaFloat = cashMovements
            .filter(m => m.type === "FLOAT_IN" && m.payment_method === "MPESA")
            .sort((a, b) => ((a.created_at) || "").localeCompare((b.created_at) || ""))[0]
        return { cash: cashFloat ?? null, mpesa: mpesaFloat ?? null }
    }, [cashMovements])

    useEffect(() => {
        if (startingFloats.cash && !startingCash) {
            setStartingCash(String(startingFloats.cash.amount))
        }
        if (startingFloats.mpesa && !startingMpesa) {
            setStartingMpesa(String(startingFloats.mpesa.amount))
        }
    }, [startingFloats.cash?.id, startingFloats.mpesa?.id])

    useEffect(() => {
        if (reconciliation) {
            if (reconciliation.actual_cash_amount != null && !cash) {
                setCash(String(reconciliation.actual_cash_amount))
            }
            if (reconciliation.actual_mpesa_amount != null && !mpesa) {
                setMpesa(String(reconciliation.actual_mpesa_amount))
            }
        }
    }, [reconciliation?.id])

    function handleAddCorrection() {
        if (!selectedItemId || !editValue.trim()) return
        const corrected = parseFloat(editValue)
        if (isNaN(corrected)) return
        const name = itemMap.get(selectedItemId)?.name || selectedItemId.slice(0, 8)
        setPendingCorrections((prev) => {
            const next = new Map(prev)
            next.set(selectedItemId, { name, correctedQty: corrected })
            return next
        })
        setSelectedItemId(null)
        setEditValue("")
    }

    function handleRemovePending(itemId: string) {
        setPendingCorrections((prev) => {
            const next = new Map(prev)
            next.delete(itemId)
            return next
        })
    }

    function handleSaveStockCorrections() {
        const entries = Array.from(pendingCorrections.entries())
            .map(([itemId, { correctedQty }]) => {
                const original = stockTakes?.find((st) => st.item_id === itemId)
                return {
                    item_id: itemId,
                    shop_id: shift.shop_id,
                    shift_id: shift.id,
                    expected_qty: original?.expected_qty ?? 0,
                    counted_qty: correctedQty,
                    variance: correctedQty - (original?.expected_qty ?? 0),
                    notes: original?.notes,
                    is_adjusted: false,
                } as Partial<StockTake>
            })

        if (entries.length === 0) return
        onAmendStockTakes(entries)
    }

    async function handleSaveStartingFloats() {
        const updates: { id: string; amount: number }[] = []

        if (startingCash.trim()) {
            const val = parseFloat(startingCash)
            if (!isNaN(val) && startingFloats.cash && val !== startingFloats.cash.amount) {
                updates.push({ id: startingFloats.cash.id, amount: val })
            }
        }
        if (startingMpesa.trim()) {
            const val = parseFloat(startingMpesa)
            if (!isNaN(val) && startingFloats.mpesa && val !== startingFloats.mpesa.amount) {
                updates.push({ id: startingFloats.mpesa.id, amount: val })
            }
        }

        if (updates.length === 0) return

        setIsSavingStartingFloats(true)
        try {
            await Promise.all(updates.map(u => shiftService.updateCashMovement(u.id, { amount: u.amount })))
            toast.success("Starting amounts saved")
            refetchCashMovements()
        } catch {
            toast.error("Failed to save starting amounts")
        } finally {
            setIsSavingStartingFloats(false)
        }
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
                        <h4 className="font-bold text-sm">Starting Amounts</h4>
                    </div>
                    {!cashMovements ? (
                        <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="starting-cash">Starting Cash (KES)</Label>
                                    <Input
                                        id="starting-cash"
                                        type="number"
                                        value={startingCash}
                                        onChange={(e) => setStartingCash(e.target.value)}
                                        placeholder="0.00"
                                        step="any"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="starting-mpesa">Starting M-Pesa (KES)</Label>
                                    <Input
                                        id="starting-mpesa"
                                        type="number"
                                        value={startingMpesa}
                                        onChange={(e) => setStartingMpesa(e.target.value)}
                                        placeholder="0.00"
                                        step="any"
                                    />
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="mt-1"
                                onClick={handleSaveStartingFloats}
                                disabled={isSavingStartingFloats || (!startingCash.trim() && !startingMpesa.trim())}
                            >
                                {isSavingStartingFloats ? "Saving..." : "Save Starting Amounts"}
                            </Button>
                        </div>
                    )}
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
                        <div className="space-y-3">
                            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={comboboxOpen}
                                        className="w-full justify-between text-sm font-normal"
                                    >
                                        {selectedItemId
                                            ? (itemMap.get(selectedItemId)?.name || selectedItemId.slice(0, 8))
                                            : "Select an item..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search items..." />
                                        <CommandList>
                                            <CommandEmpty>No item found.</CommandEmpty>
                                            <CommandGroup>
                                                {stockTakes.map((st) => {
                                                    const name = itemMap.get(st.item_id)?.name || st.item_id.slice(0, 8)
                                                    return (
                                                        <CommandItem
                                                            key={st.item_id}
                                                            value={name}
                                                            onSelect={() => {
                                                                setSelectedItemId(st.item_id)
                                                                setEditValue(String(st.counted_qty))
                                                                setComboboxOpen(false)
                                                            }}
                                                        >
                                                            <CheckIcon
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedItemId === st.item_id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {name}
                                                        </CommandItem>
                                                    )
                                                })}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            {selectedStockTake && (
                                <div className="border rounded-md p-3 space-y-3 bg-muted/10">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-sm">
                                            {itemMap.get(selectedStockTake.item_id)?.name || selectedStockTake.item_id.slice(0, 8)}
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0"
                                            onClick={() => {
                                                setSelectedItemId(null)
                                                setEditValue("")
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-background rounded p-2">
                                            <p className="text-xs text-muted-foreground">Expected</p>
                                            <p className="text-lg font-bold">{selectedStockTake.expected_qty}</p>
                                        </div>
                                        <div className="bg-background rounded p-2">
                                            <p className="text-xs text-muted-foreground">Counted</p>
                                            <p className="text-lg font-bold">{selectedStockTake.counted_qty}</p>
                                        </div>
                                        <div className="bg-background rounded p-2">
                                            <p className="text-xs text-muted-foreground">Variance</p>
                                            <p className={`text-lg font-bold ${(selectedStockTake.counted_qty - selectedStockTake.expected_qty) === 0 ? "" : (selectedStockTake.counted_qty - selectedStockTake.expected_qty) > 0 ? "text-green-600" : "text-red-600"}`}>
                                                {(() => {
                                                    const v = selectedStockTake.counted_qty - selectedStockTake.expected_qty
                                                    return v > 0 ? `+${v}` : v
                                                })()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <Label htmlFor="corrected-qty" className="text-xs">Corrected Quantity</Label>
                                            <Input
                                                id="corrected-qty"
                                                type="number"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="h-9 text-sm"
                                                step="any"
                                            />
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={handleAddCorrection}
                                            disabled={!editValue.trim() || isNaN(parseFloat(editValue))}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {pendingCorrections.size > 0 && (
                                <div className="border rounded-md p-3 space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground">
                                        Pending Corrections ({pendingCorrections.size})
                                    </p>
                                    <div className="space-y-1">
                                        {Array.from(pendingCorrections.entries()).map(([itemId, { name, correctedQty }]) => (
                                            <div key={itemId} className="flex items-center justify-between text-sm bg-background rounded px-2 py-1">
                                                <span className="truncate">{name}</span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="font-mono text-xs text-muted-foreground">→ {correctedQty}</span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-5 w-5 p-0"
                                                        onClick={() => handleRemovePending(itemId)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    handleSaveStockCorrections()
                                    setPendingCorrections(new Map())
                                }}
                                disabled={isAmendingStockTakes || pendingCorrections.size === 0}
                            >
                                {isAmendingStockTakes
                                    ? "Saving..."
                                    : `Save Corrections${pendingCorrections.size > 0 ? ` (${pendingCorrections.size})` : ""}`}
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