"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/store/use-app-store"
import { shiftService } from "@/services/shift.service"
import { Shift } from "@/types/shift"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"

function formatShiftLabel(shift: Shift) {
    const start = shift.start_time ? new Date(shift.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""
    return `${shift.name} — ${start} (${shift.closing_status})`
}

export function CorrectionsTab() {
    const { activeShop, activeShift, userInfo } = useAppStore()
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

    const [cashActual, setCashActual] = useState("")
    const [mpesaActual, setMpesaActual] = useState("")

    useEffect(() => {
        if (!activeShop?.id) return
        setLoading(true)
        shiftService
            .getShiftsByShop(activeShop.id)
            .then((s) => setShifts(s || []))
            .catch(() => setShifts([]))
            .finally(() => setLoading(false))
    }, [activeShop?.id])

    const targetShift = shifts.find((s) => s.id === selectedShiftId)
    const isCorrectable = targetShift && (targetShift.closing_status === "APPROVED" || targetShift.closing_status === "REJECTED" || targetShift.closing_status === "PENDING_CORRECTION_APPROVAL")

    const submitLateExpense = async () => {
        if (!userInfo || !targetShift) return
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
                reason: `Late correction for shift ${targetShift.name}`,
                created_by: userInfo.id,
                created_at: now,
                _version: 1,
                _last_modified_at: now,
                _is_pending: false,
            }, activeShift?.id)
            toast.success("Late cash movement recorded.")
            setCmAmount("")
            queryClient.invalidateQueries({ queryKey: ["shift-cash-movements"] })
        } catch (error: any) {
            toast.error(error.message || "Failed to record late cash movement")
        } finally {
            setBusy(false)
        }
    }

    const submitReconciliation = async () => {
        if (!userInfo || !targetShift) return
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
                _version: 1,
                _last_modified_at: now,
                _is_pending: false,
            }, activeShift?.id)
            toast.success("Cash counts corrected.")
            setCashActual("")
            setMpesaActual("")
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
                Record corrections against a prior closed shift. Corrections that change money or stock will move the shift back to pending approval.
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
                        .filter((s) => (s.closing_status === "APPROVED" || s.closing_status === "REJECTED" || s.closing_status === "PENDING_CORRECTION_APPROVAL") && s.name.toLowerCase().includes(shiftFilter.toLowerCase()))
                        .map((s) => (
                            <option key={s.id} value={s.id}>
                                {formatShiftLabel(s)}
                            </option>
                        ))}
                </select>
            </div>

            {!isCorrectable && (
                <p className="text-sm text-muted-foreground">Select an APPROVED, REJECTED, or correction-review shift to record corrections.</p>
            )}

            {isCorrectable && (
                <>
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
                                <Input id="le-desc" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} placeholder="Reason" />
                            </div>
                            <Button onClick={submitLateExpense} disabled={busy} className="w-full">
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
                            <Button onClick={submitLateCashMovement} disabled={busy} className="w-full">
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
                            <Button onClick={submitReconciliation} disabled={busy} className="w-full">
                                {busy ? "Saving..." : "Save Cash Counts"}
                            </Button>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
