"use client"

import { useEffect, useState } from "react"
import * as XLSX from "xlsx"
import { useQuery } from "@tanstack/react-query"
import { BarChart3, FileSpreadsheet, FileText, Loader2, Printer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { expenseService, ExpenseReportRow } from "@/services/expense.service"
import { shiftService } from "@/services/shift.service"
import { userService } from "@/services/user.service"
import { useAppStore } from "@/store/use-app-store"

interface ExpenseReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const expenseCategories = [
    "RENT", "UTILITIES", "TRANSPORT", "SALARIES", "MARKETING",
    "SUPPLIES", "INSURANCE", "MAINTENANCE", "FOOD-LUNCH", "GENERAL",
]

function localDateInputValue(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function escapeHtml(value: unknown): string {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[character]!)
}

function formatAmount(amount: number): string {
    return `KES ${Number(amount || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function ExpenseReportDialog({ open, onOpenChange }: ExpenseReportDialogProps) {
    const userInfo = useAppStore((state) => state.userInfo)
    const activeShop = useAppStore((state) => state.activeShop)
    const shopId = activeShop?.id || ""
    const isManager = ["manager", "admin"].includes(activeShop?.role?.toLowerCase() || "")
    const [startDate, setStartDate] = useState(() => localDateInputValue(new Date()))
    const [endDate, setEndDate] = useState(() => localDateInputValue(new Date()))
    const [cashierId, setCashierId] = useState("all")
    const [shiftId, setShiftId] = useState("all")
    const [category, setCategory] = useState("all")
    const [paymentMethod, setPaymentMethod] = useState("all")
    const [isGenerating, setIsGenerating] = useState(false)

    useEffect(() => {
        if (!open) return
        setCashierId("all")
        setShiftId("all")
    }, [open, shopId])

    const { data: cashiers = [], isLoading: isLoadingCashiers } = useQuery({
        queryKey: ["report-cashiers", shopId, startDate, endDate],
        queryFn: () => userService.getReportCashiers(shopId, startDate, endDate),
        enabled: open && isManager && !!shopId && !!startDate && !!endDate && startDate <= endDate,
    })

    const { data: shifts = [], isLoading: isLoadingShifts } = useQuery({
        queryKey: ["shifts", shopId, startDate, endDate, cashierId, isManager, userInfo?.id],
        queryFn: () => shiftService.getShiftsByShopAndDate(
            shopId,
            startDate,
            endDate,
            isManager
                ? (cashierId === "all" ? undefined : cashierId)
                : userInfo?.id
        ),
        enabled: open && !!shopId && !!startDate && !!endDate && startDate <= endDate && (isManager || !!userInfo?.id),
    })

    const handleGenerateReport = async (action: "preview" | "excel" | "pdf") => {
        if (!shopId) {
            toast.error("No shop selected")
            return
        }
        if (!startDate || !endDate || startDate > endDate) {
            toast.error("Choose a valid date range")
            return
        }

        setIsGenerating(true)
        try {
            const rows = await expenseService.getExpenseReport({
                shopId,
                startDate,
                endDate,
                cashierId: isManager && cashierId !== "all" ? cashierId : undefined,
                shiftId: shiftId === "all" ? undefined : shiftId,
                category: category === "all" ? undefined : category,
                paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
            })
            const cashierName = cashierId === "all"
                ? (isManager ? "All Cashiers" : userInfo?.name || "My Expenses")
                : cashiers.find((cashier) => cashier.id === cashierId)?.name
                    || cashiers.find((cashier) => cashier.id === cashierId)?.email
                    || "Selected Cashier"
            const selectedShift = shifts.find((shift) => shift.id === shiftId)
            const shiftName = shiftId === "all"
                ? "All Shifts"
                : selectedShift?.name || `Shift ${shiftId.slice(0, 8)}`
            const categoryName = category === "all" ? "All Categories" : category
            const paymentName = paymentMethod === "all" ? "All Payment Methods" : paymentMethod
            const totalAmount = rows.reduce((total, row) => total + Number(row.amount || 0), 0)
            const categoryTotals = sumBy(rows, (row) => row.category || "Uncategorized")
            const paymentTotals = sumBy(rows, (row) => row.payment_method || "Unknown")

            if (action === "excel") {
                exportExpenseReportToExcel(rows, {
                    shopName: activeShop?.name || "Shop",
                    userName: userInfo?.name || "User",
                    startDate,
                    endDate,
                    cashierName,
                    shiftName,
                    categoryName,
                    paymentName,
                    totalAmount,
                    categoryTotals,
                    paymentTotals,
                })
                toast.success("Expense report exported")
            } else {
                const html = formatExpenseReportHtml(rows, {
                    shopName: activeShop?.name || "Shop",
                    userName: userInfo?.name || "User",
                    startDate,
                    endDate,
                    cashierName,
                    shiftName,
                    categoryName,
                    paymentName,
                    totalAmount,
                    categoryTotals,
                    paymentTotals,
                })
                const printWindow = window.open("", "_blank")
                if (!printWindow) {
                    toast.error("Pop-up blocked. Please allow pop-ups to view the report.")
                } else {
                    printWindow.document.write(html)
                    printWindow.document.close()
                    if (action === "pdf") {
                        printWindow.focus()
                        printWindow.print()
                    }
                }
            }
        } catch (error) {
            console.error("Expense report generation failed:", error)
            toast.error(error instanceof Error ? error.message : "Failed to generate expense report")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Expense Report</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Shop</Label>
                        <Input disabled value={activeShop?.name || "No shop selected"} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>From</Label>
                            <Input type="date" value={startDate} max={endDate || undefined} onChange={(event) => {
                                setStartDate(event.target.value)
                                setShiftId("all")
                            }} />
                        </div>
                        <div className="space-y-2">
                            <Label>To</Label>
                            <Input type="date" value={endDate} min={startDate || undefined} onChange={(event) => {
                                setEndDate(event.target.value)
                                setShiftId("all")
                            }} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Cashier</Label>
                        <Select value={cashierId} onValueChange={(value) => {
                            setCashierId(value)
                            setShiftId("all")
                        }} disabled={!isManager}>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingCashiers ? "Loading cashiers..." : "Select cashier"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{isManager ? "All Cashiers" : userInfo?.name || "My Expenses"}</SelectItem>
                                {isManager && cashiers.map((cashier) => (
                                    <SelectItem key={cashier.id} value={cashier.id}>
                                        {cashier.name || cashier.email || "User"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {!isManager && (
                            <p className="text-xs text-muted-foreground">Cashiers can report only their own expenses.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Shift</Label>
                            <Select value={shiftId} onValueChange={setShiftId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingShifts ? "Loading shifts..." : "Select shift"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Shifts</SelectItem>
                                    {shifts.map((shift) => (
                                        <SelectItem key={shift.id} value={shift.id}>
                                            {shift.name} ({new Date(shift.start_time).toLocaleDateString()})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {expenseCategories.map((item) => (
                                        <SelectItem key={item} value={item}>{item.replace("-", " / ")}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Payment Methods</SelectItem>
                                {["CASH", "MPESA", "CARD", "BANK_TRANSFER", "OTHER"].map((method) => (
                                    <SelectItem key={method} value={method}>{method.replace("_", " ")}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Reports posted expenses by expense date. Reversed expenses are excluded.
                    </p>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={() => handleGenerateReport("preview")} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        Preview
                    </Button>
                    <div className="flex w-full gap-2 sm:w-auto">
                        <Button onClick={() => handleGenerateReport("excel")} disabled={isGenerating} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700">
                            <FileSpreadsheet className="mr-2 h-4 w-4" />Excel
                        </Button>
                        <Button variant="destructive" onClick={() => handleGenerateReport("pdf")} disabled={isGenerating} className="flex-1">
                            <Printer className="mr-2 h-4 w-4" />PDF
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface ExpenseReportMetadata {
    shopName: string
    userName: string
    startDate: string
    endDate: string
    cashierName: string
    shiftName: string
    categoryName: string
    paymentName: string
    totalAmount: number
    categoryTotals: Record<string, number>
    paymentTotals: Record<string, number>
}

function sumBy(rows: ExpenseReportRow[], keyForRow: (row: ExpenseReportRow) => string): Record<string, number> {
    return rows.reduce<Record<string, number>>((totals, row) => {
        const key = keyForRow(row)
        totals[key] = (totals[key] || 0) + Number(row.amount || 0)
        return totals
    }, {})
}

function formatExpenseReportHtml(rows: ExpenseReportRow[], metadata: ExpenseReportMetadata): string {
    const detailRows = rows.map((row) => `
        <tr>
            <td>${escapeHtml(new Date(row.expense_date).toLocaleString("en-KE"))}</td>
            <td>${escapeHtml(row.category)}</td>
            <td>${escapeHtml(row.description || row.notes || "-")}</td>
            <td>${escapeHtml(row.cashierName || row.cashierEmail || "User")}</td>
            <td>${escapeHtml(row.shiftName || row.shift_id.slice(0, 8))}</td>
            <td>${escapeHtml(row.payment_method || "Unknown")}</td>
            <td class="amount">${escapeHtml(formatAmount(Number(row.amount)))}</td>
        </tr>`).join("")
    const breakdown = (totals: Record<string, number>) => Object.entries(totals)
        .sort(([, left], [, right]) => right - left)
        .map(([label, amount]) => `<tr><td>${escapeHtml(label)}</td><td class="amount">${escapeHtml(formatAmount(amount))}</td></tr>`)
        .join("")

    return `<!doctype html>
<html><head><meta charset="utf-8"><title>Expense Report</title>
<style>
@page{size:A4 landscape;margin:12mm}body{font:12px Arial,sans-serif;color:#111;margin:0}
h1{margin:0 0 6px;font-size:22px}.muted{color:#555}.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:18px 0}
.summary{display:flex;gap:24px;padding:12px;background:#f3f4f6;margin:16px 0;font-weight:bold}
table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:7px;text-align:left}th{background:#eee}.amount{text-align:right;white-space:nowrap}
.breakdowns{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:16px 0}.breakdowns h2,h2{font-size:15px;margin:12px 0 6px}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
<h1>Expense Report</h1><div class="muted">${escapeHtml(metadata.shopName)}</div>
<div class="meta">
 <div><b>Period:</b> ${escapeHtml(metadata.startDate)} to ${escapeHtml(metadata.endDate)}</div>
 <div><b>Cashier:</b> ${escapeHtml(metadata.cashierName)}</div>
 <div><b>Shift:</b> ${escapeHtml(metadata.shiftName)}</div>
 <div><b>Category:</b> ${escapeHtml(metadata.categoryName)}</div>
 <div><b>Payment:</b> ${escapeHtml(metadata.paymentName)}</div>
 <div><b>Generated by:</b> ${escapeHtml(metadata.userName)}</div>
</div>
<div class="summary"><span>Posted expenses: ${rows.length}</span><span>Total: ${escapeHtml(formatAmount(metadata.totalAmount))}</span></div>
<p class="muted">Posted expenses only. Reversed expenses are excluded.</p>
<div class="breakdowns">
 <section><h2>By Category</h2><table><thead><tr><th>Category</th><th class="amount">Total</th></tr></thead><tbody>${breakdown(metadata.categoryTotals) || '<tr><td colspan="2">No expenses</td></tr>'}</tbody></table></section>
 <section><h2>By Payment Method</h2><table><thead><tr><th>Payment Method</th><th class="amount">Total</th></tr></thead><tbody>${breakdown(metadata.paymentTotals) || '<tr><td colspan="2">No expenses</td></tr>'}</tbody></table></section>
</div>
<h2>Expense Details</h2>
<table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Cashier</th><th>Shift</th><th>Payment</th><th class="amount">Amount</th></tr></thead>
<tbody>${detailRows || '<tr><td colspan="7">No posted expenses found for the selected filters.</td></tr>'}</tbody></table>
</body></html>`
}

function exportExpenseReportToExcel(rows: ExpenseReportRow[], metadata: ExpenseReportMetadata) {
    const workbook = XLSX.utils.book_new()
    const summary = [
        ["Expense Report"],
        ["Shop", metadata.shopName],
        ["Period", `${metadata.startDate} to ${metadata.endDate}`],
        ["Cashier", metadata.cashierName],
        ["Shift", metadata.shiftName],
        ["Category", metadata.categoryName],
        ["Payment method", metadata.paymentName],
        ["Generated by", metadata.userName],
        ["Status scope", "Posted expenses only; reversed expenses excluded"],
        ["Expense count", rows.length],
        ["Total amount (KES)", metadata.totalAmount],
        [],
        ["Totals by category"],
        ["Category", "Amount (KES)"],
        ...Object.entries(metadata.categoryTotals).sort(([, left], [, right]) => right - left),
        [],
        ["Totals by payment method"],
        ["Payment method", "Amount (KES)"],
        ...Object.entries(metadata.paymentTotals).sort(([, left], [, right]) => right - left),
    ]
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), "Summary")

    const detailData = [
        ["Expense ID", "Expense Date", "Category", "Description", "Notes", "Cashier", "Shift", "Payment Method", "Amount (KES)"],
        ...rows.map((row) => [
            row.id,
            row.expense_date,
            row.category,
            row.description || "",
            row.notes || "",
            row.cashierName || row.cashierEmail || "User",
            row.shiftName || row.shift_id,
            row.payment_method || "Unknown",
            Number(row.amount),
        ]),
    ]
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(detailData), "Expenses")
    XLSX.writeFile(workbook, `Expense_Report_${metadata.startDate}_${metadata.endDate}.xlsx`)
}
