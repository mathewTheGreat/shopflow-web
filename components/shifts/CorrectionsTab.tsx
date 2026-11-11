"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/store/use-app-store"
import { shiftService } from "@/services/shift.service"
import { isRejectedShift, Shift } from "@/types/shift"
import { CorrectionCasePanel } from "./CorrectionCasePanel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"

function formatShiftLabel(shift: Shift) {
    const start = shift.start_time ? new Date(shift.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""
    const status = isRejectedShift(shift) ? "REJECTED" : shift.closing_status
    return `${shift.name} — ${start} (${status})`
}

export function CorrectionsTab() {
    const { activeShop, activeShift, userInfo } = useAppStore()
    const isManager = activeShop?.role === "Manager" || activeShop?.role === "Admin"
    const queryClient = useQueryClient()

    const [shifts, setShifts] = useState<Shift[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedShiftId, setSelectedShiftId] = useState("")
    const [shiftFilter, setShiftFilter] = useState("")
    const [busy, setBusy] = useState(false)

    const [expenseAmount, setExpenseAmount] = useState("")
    const [expenseCategory, setExpenseCategory] = useState("general")
    const [expenseDesc, setExpenseDesc] = useState("")

    const [cmType, setCmType] = useState<"PAY_IN" | "PAY_OUT" | "FLOAT_IN">("PAY_IN")
    const [cmAmount, setCmAmount] = useState("")
    const [cmMethod, setCmMethod] = useState<"CASH" | "MPESA">("CASH")
    const [cmReason, setCmReason] = useState("")

    const [cashActual, setCashActual] = useState("")
    const [mpesaActual, setMpesaActual] = useState("")
    const [reconciliationReason, setReconciliationReason] = useState("")

    useEffect(() => {
        if (!activeShop?.id) return
        setLoading(true)
        shiftService
            .getShiftsByShop(activeShop.id)
            .then((s) => setShifts(s || []))
            .catch((error: Error) => {
                toast.error(error.message || "Could not load shifts for correction")
                setShifts([])
            })
            .finally(() => setLoading(false))
    }, [activeShop?.id])

    const targetShift = shifts.find((s) => s.id === selectedShiftId)
    const isCorrectable = targetShift && (
        isRejectedShift(targetShift)
        || targetShift.closing_status === "PENDING_CORRECTION_APPROVAL"
        || targetShift.closing_status === "PENDING_APPROVAL"
    )

    const submitLateExpense = async () => {
        if (!userInfo || !targetShift) return
        if (!expenseDesc.trim()) {
            toast.error("Enter a reason for the late expense")
            return
        }
        const amount = parseFloat(expenseAmount)
        if (!amount || amount <= 0) {
            toast.error("Enter a valid expense amount")
            return
        }
        setBusy(true)
        try {
            const now = new Date().toISOString()
            await shiftService.createLateExpense(targetShift.id, userInfo.id, {
                id: uuidv4(),
                shop_id: targetShift.shop_id,
                shift_id: targetShift.id,
                expense_date: now,
                amount,
                description: expenseDesc || `Late correction for shift ${targetShift.name}`,
                category: expenseCategory,
                created_by: userInfo.id,
                created_at: now,
                _version: 1,
                _last_modified_at: now,
                _is_pending: false,
            }, activeShift?.id)
            toast.success("Late expense recorded. Shift moved to pending approval.")
            setExpenseAmount("")
            setExpenseDesc("")
            queryClient.invalidateQueries({ queryKey: ["expenses"] })
            queryClient.invalidateQueries({ queryKey: ["pending-approvals"] })
            queryClient.invalidateQueries({ queryKey: ["rejected-shifts-v2"] })
        } catch (error: any) {
            toast.error(error.message || "Failed to record late expense")
        } finally {
            setBusy(false)
        }
    }

    const submitLateCashMovement = async () => {
        if (!userInfo || !targetShift) return
        if (!cmReason.trim()) {
            toast.error("Enter a reason for the cash movement")
            return
        }
        const amount = parseFloat(cmAmount)
        if (!amount || amount <= 0) {
            toast.error("Enter a valid amount")
            return
        }
        setBusy(true)
        try {
            const now = new Date().toISOString()
            await shiftService.createLateCashMovement(targetShift.id, userInfo.id, {
                id: uuidv4(),
                shift_id: targetShift.id,
                type: cmType,
                amount,
                payment_method: cmMethod,
                reason: cmReason.trim(),
                created_by: userInfo.id,
                created_at: now,
                _version: 1,
                _last_modified_at: now,
                _is_pending: false,
            }, activeShift?.id)
            toast.success("Late cash movement recorded.")
            setCmAmount("")
            setCmReason("")
            queryClient.invalidateQueries({ queryKey: ["shift-cash-movements"] })
        } catch (error: any) {
            toast.error(error.message || "Failed to record late cash movement")
        } finally {
            setBusy(false)
        }
    }

    const submitReconciliation = async () => {
        if (!userInfo || !targetShift) return
        if (!reconciliationReason.trim()) {
            toast.error("Enter a reason for correcting the cash counts")
            return
        }
        setBusy(true)
        try {
            const now = new Date().toISOString()
            await shiftService.createLateReconciliation(targetShift.id, userInfo.id, {
                id: uuidv4(),
                shift_id: targetShift.id,
                actual_cash_amount: parseFloat(cashActual) || 0,
                actual_mpesa_amount: parseFloat(mpesaActual) || 0,
                status: "RECONCILED",
                reconciled_by: userInfo.id,
                reconciliation_date: now,
                created_by: userInfo.id,
                created_at: now,
                notes: reconciliationReason.trim(),
                _version: 1,
                _last_modified_at: now,
                _is_pending: false,
            }, activeShift?.id)
            toast.success("Cash counts corrected.")
            setCashActual("")
            setMpesaActual("")
            setReconciliationReason("")
            queryClient.invalidateQueries({ queryKey: ["current-shift"] })
        } catch (error: any) {
            toast.error(error.message || "Failed to correct reconciliation")
        } finally {
            setBusy(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md text-sm text-blue-800 dark:text-blue-200">
                Record corrections against a shift awaiting approval or a rejected shift. A manager must reject an already approved shift before it can be corrected.
            </div>

            <div className="space-y-2">
                <Label htmlFor="correction-shift">Target Shift</Label>
                <Input
                    placeholder="Filter shifts by name..."
                    value={shiftFilter}
                    onChange={(e) => setShiftFilter(e.target.value)}
                    className="h-10"
                />
                <select
                    id="correction-shift"
                    value={selectedShiftId}
                    onChange={(e) => setSelectedShiftId(e.target.value)}
                    className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                >
                    <option value="">Select a shift…</option>
                    {shifts
                        .filter((s) => (isManager || s.manager_id === userInfo?.id)
                            && (isRejectedShift(s) || s.closing_status === "PENDING_CORRECTION_APPROVAL" || s.closing_status === "PENDING_APPROVAL")
                            && s.name.toLowerCase().includes(shiftFilter.toLowerCase()))
                        .map((s) => (
                            <option key={s.id} value={s.id}>
                                {formatShiftLabel(s)}
                            </option>
                        ))}
                </select>
            </div>

            {!isCorrectable && (
                <p className="text-sm text-muted-foreground">Select a shift awaiting approval, a rejected shift, or a correction-review shift. A manager must reject an approved shift before it can be corrected.</p>
            )}

            {isCorrectable && targetShift && (
                <CorrectionCasePanel targetShift={targetShift} recordedShiftId={activeShift?.id} />
            )}

            {isCorrectable && targetShift && (isRejectedShift(targetShift) || targetShift.closing_status === "PENDING_CORRECTION_APPROVAL") && (
                <details className="rounded-md border p-4">
                    <summary className="cursor-pointer text-sm font-medium">Individual correction tools</summary>
                    <div className="mt-4 space-y-4">
                    <Card className="bg-card border shadow-sm">
                        <CardContent className="p-4 space-y-3">
                            <h3 className="font-bold text-sm">Late Expense</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="le-amount">Amount</Label>
                                    <Input id="le-amount" type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="0.00" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="le-category">Category</Label>
                                    <Input id="le-category" value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="le-desc">Description</Label>
                                <Input id="le-desc" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} placeholder="What was the expense for?" />
                            </div>
                            <Button onClick={submitLateExpense} disabled={busy || !expenseDesc.trim()} className="w-full">
                                {busy ? "Saving..." : "Record Late Expense"}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border shadow-sm">
                        <CardContent className="p-4 space-y-3">
                            <h3 className="font-bold text-sm">Late Cash Movement</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="cm-type">Type</Label>
                                    <select id="cm-type" value={cmType} onChange={(e) => setCmType(e.target.value as any)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                                        <option value="PAY_IN">Pay In</option>
                                        <option value="PAY_OUT">Pay Out</option>
                                        <option value="FLOAT_IN">Float In</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="cm-method">Method</Label>
                                    <select id="cm-method" value={cmMethod} onChange={(e) => setCmMethod(e.target.value as any)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                                        <option value="CASH">Cash</option>
                                        <option value="MPESA">M-Pesa</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="cm-amount">Amount</Label>
                                    <Input id="cm-amount" type="number" value={cmAmount} onChange={(e) => setCmAmount(e.target.value)} placeholder="0.00" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="cm-reason">Reason</Label>
                                <Input id="cm-reason" value={cmReason} onChange={(e) => setCmReason(e.target.value)} placeholder="Why is this movement being recorded late?" />
                            </div>
                            <Button onClick={submitLateCashMovement} disabled={busy || !cmReason.trim()} className="w-full">
                                {busy ? "Saving..." : "Record Cash Movement"}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border shadow-sm">
                        <CardContent className="p-4 space-y-3">
                            <h3 className="font-bold text-sm">Correct Cash Counts</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="rc-cash">Actual Cash</Label>
                                    <Input id="rc-cash" type="number" value={cashActual} onChange={(e) => setCashActual(e.target.value)} placeholder="0.00" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="rc-mpesa">Actual M-Pesa</Label>
                                    <Input id="rc-mpesa" type="number" value={mpesaActual} onChange={(e) => setMpesaActual(e.target.value)} placeholder="0.00" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="rc-reason">Correction Reason</Label>
                                <Input id="rc-reason" value={reconciliationReason} onChange={(e) => setReconciliationReason(e.target.value)} placeholder="Explain why these counts are being corrected" />
                            </div>
                            <Button onClick={submitReconciliation} disabled={busy || !reconciliationReason.trim()} className="w-full">
                                {busy ? "Saving..." : "Save Cash Counts"}
                            </Button>
                        </CardContent>
                    </Card>
                    </div>
                </details>
            )}
        </div>
    )
}
