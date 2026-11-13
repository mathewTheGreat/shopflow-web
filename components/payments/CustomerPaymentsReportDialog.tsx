"use client"

import { useEffect, useState } from "react"
import * as XLSX from "xlsx"
import { useQuery } from "@tanstack/react-query"
import { FileSpreadsheet, FileText, Loader2, Printer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CustomerPaymentReportRow, customerPaymentService } from "@/services/customer-payment.service"
import { shiftService } from "@/services/shift.service"
import { userService } from "@/services/user.service"
import { useAppStore } from "@/store/use-app-store"

interface CustomerPaymentsReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

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

function transactionImpact(transaction: CustomerPaymentReportRow): number {
    return transaction.type === "DEBIT" ? -Number(transaction.amount) : Number(transaction.amount)
}

function sumByType(rows: CustomerPaymentReportRow[]): Record<string, number> {
    return rows.reduce<Record<string, number>>((totals, row) => {
        totals[row.type] = (totals[row.type] || 0) + Number(row.amount)
        return totals
    }, {})
}

export function CustomerPaymentsReportDialog({ open, onOpenChange }: CustomerPaymentsReportDialogProps) {
    const userInfo = useAppStore((state) => state.userInfo)
    const activeShop = useAppStore((state) => state.activeShop)
    const shopId = activeShop?.id || ""
    const isManager = ["manager", "admin"].includes(activeShop?.role?.toLowerCase() || "")
    const [startDate, setStartDate] = useState(() => {
        const date = new Date()
        date.setDate(date.getDate() - 6)
        return localDateInputValue(date)
    })
    const [endDate, setEndDate] = useState(() => localDateInputValue(new Date()))
    const [cashierId, setCashierId] = useState("all")
    const [shiftId, setShiftId] = useState("all")
    const [type, setType] = useState("all")
    const [paymentMethod, setPaymentMethod] = useState("all")
    const [isGenerating, setIsGenerating] = useState(false)

    useEffect(() => {
        if (!open) return
        setCashierId("all")
        setShiftId("all")
    }, [open, shopId])

    const validRange = !!startDate && !!endDate && startDate <= endDate
    const { data: cashiers = [], isLoading: isLoadingCashiers } = useQuery({
        queryKey: ["report-cashiers", shopId, startDate, endDate],
        queryFn: () => userService.getReportCashiers(shopId, startDate, endDate),
        enabled: open && isManager && !!shopId && validRange,
    })

    const { data: shifts = [], isLoading: isLoadingShifts } = useQuery({
        queryKey: ["shifts", shopId, startDate, endDate, cashierId, isManager, userInfo?.id],
        queryFn: () => shiftService.getShiftsByShopAndDate(
            shopId,
            startDate,
            endDate,
            isManager ? (cashierId === "all" ? undefined : cashierId) : userInfo?.id
        ),
        enabled: open && !!shopId && validRange && (isManager || !!userInfo?.id),
    })

    const handleGenerateReport = async (action: "preview" | "excel" | "pdf") => {
        if (!shopId) {
            toast.error("No shop selected")
            return
        }
        if (!validRange) {
            toast.error("Choose a valid date range")
            return
        }

        setIsGenerating(true)
        try {
            const rows = await customerPaymentService.getPaymentReport({
                shopId,
                startDate,
                endDate,
                cashierId: isManager && cashierId !== "all" ? cashierId : undefined,
                shiftId: shiftId === "all" ? undefined : shiftId,
                type: type === "all" ? undefined : type,
                paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
            })
            const byType = sumByType(rows)
            const signedTotal = rows.reduce((total, row) => total + transactionImpact(row), 0)
            const cashierName = cashierId === "all"
                ? (isManager ? "All Cashiers" : userInfo?.name || "My Transactions")
                : cashiers.find((cashier) => cashier.id === cashierId)?.name
                    || cashiers.find((cashier) => cashier.id === cashierId)?.email
                    || "Selected Cashier"
            const selectedShift = shifts.find((shift) => shift.id === shiftId)
            const shiftName = shiftId === "all"
                ? "All Shifts"
                : selectedShift?.name || `Shift ${shiftId.slice(0, 8)}`
            const metadata = {
                shopName: activeShop?.name || "Shop",
                generatedBy: userInfo?.name || "User",
                startDate,
                endDate,
                cashierName,
                shiftName,
                typeName: type === "all" ? "All Transaction Types" : type,
                paymentName: paymentMethod === "all" ? "All Payment Methods" : paymentMethod,
                signedTotal,
                byType,
            }

            if (action === "excel") {
                exportPaymentsToExcel(rows, metadata)
                toast.success("Payments report exported")
            } else {
                const printWindow = window.open("", "_blank")
                if (!printWindow) {
                    toast.error("Pop-up blocked. Please allow pop-ups to view the report.")
                } else {
                    printWindow.document.write(formatPaymentsReportHtml(rows, metadata))
                    printWindow.document.close()
                    if (action === "pdf") {
                        printWindow.focus()
                        printWindow.print()
                    }
                }
            }
        } catch (error) {
            console.error("Customer payments report generation failed:", error)
            toast.error(error instanceof Error ? error.message : "Failed to generate payments report")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader><DialogTitle>Customer Payments Report</DialogTitle></DialogHeader>

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

                    <div className="grid grid-cols-2 gap-4">
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
                                    <SelectItem value="all">{isManager ? "All Cashiers" : userInfo?.name || "My Transactions"}</SelectItem>
                                    {isManager && cashiers.map((cashier) => (
                                        <SelectItem key={cashier.id} value={cashier.id}>
                                            {cashier.name || cashier.email || "User"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Transaction Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger><SelectValue placeholder="Select transaction type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {["CREDIT", "DEBIT", "REFUND", "ADJUSTMENT"].map((item) => (
                                        <SelectItem key={item} value={item}>{item}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Methods</SelectItem>
                                    {["CASH", "MPESA", "CARD", "BANK_TRANSFER", "OTHER"].map((method) => (
                                        <SelectItem key={method} value={method}>{method.replace("_", " ")}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Includes original and reversal entries. Reversals offset the original transaction in the net account impact.
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

interface PaymentsReportMetadata {
    shopName: string
    generatedBy: string
    startDate: string
    endDate: string
    cashierName: string
    shiftName: string
    typeName: string
    paymentName: string
    signedTotal: number
    byType: Record<string, number>
}

function formatPaymentsReportHtml(rows: CustomerPaymentReportRow[], metadata: PaymentsReportMetadata): string {
    const details = rows.map((row) => `
        <tr>
            <td>${escapeHtml(row.created_at ? new Date(row.created_at).toLocaleString("en-KE") : "-")}</td>
            <td>${escapeHtml(row.customerName || "Unknown Customer")}</td>
            <td>${escapeHtml(row.type)}${row.reversal_of ? " (Reversal)" : ""}</td>
            <td>${escapeHtml(row.payment_method)}</td>
            <td>${escapeHtml(row.cashierName || row.cashierEmail || "User")}</td>
            <td>${escapeHtml(row.shiftName || row.shift_id || "-")}</td>
            <td>${escapeHtml(row.notes || "-")}</td>
            <td class="amount">${escapeHtml(formatAmount(Number(row.amount)))}</td>
            <td class="amount">${escapeHtml(formatAmount(transactionImpact(row)))}</td>
        </tr>`).join("")
    const typeTotals = Object.entries(metadata.byType)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([label, amount]) => `<tr><td>${escapeHtml(label)}</td><td class="amount">${escapeHtml(formatAmount(amount))}</td></tr>`)
        .join("")

    return `<!doctype html><html><head><meta charset="utf-8"><title>Customer Payments Report</title>
<style>
@page{size:A4 landscape;margin:12mm}body{font:12px Arial,sans-serif;color:#111;margin:0}
h1{margin:0 0 6px;font-size:22px}.muted{color:#555}.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:18px 0}
.summary{display:flex;gap:24px;padding:12px;background:#f3f4f6;margin:16px 0;font-weight:bold}
table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #ccc;padding:7px;text-align:left}th{background:#eee}.amount{text-align:right;white-space:nowrap}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
<h1>Customer Payments Report</h1><div class="muted">${escapeHtml(metadata.shopName)}</div>
<div class="meta">
 <div><b>Period:</b> ${escapeHtml(metadata.startDate)} to ${escapeHtml(metadata.endDate)}</div>
 <div><b>Cashier:</b> ${escapeHtml(metadata.cashierName)}</div>
 <div><b>Shift:</b> ${escapeHtml(metadata.shiftName)}</div>
 <div><b>Transaction type:</b> ${escapeHtml(metadata.typeName)}</div>
 <div><b>Payment method:</b> ${escapeHtml(metadata.paymentName)}</div>
 <div><b>Generated by:</b> ${escapeHtml(metadata.generatedBy)}</div>
</div>
<div class="summary"><span>Transactions: ${rows.length}</span><span>Net customer-account impact: ${escapeHtml(formatAmount(metadata.signedTotal))}</span></div>
<p class="muted">Positive net impact increases the customer account balance; negative impact reduces it. Original and reversal rows are shown.</p>
<h2>Totals by Transaction Type</h2>
<table><thead><tr><th>Type</th><th class="amount">Gross Amount</th></tr></thead><tbody>${typeTotals || '<tr><td colspan="2">No transactions</td></tr>'}</tbody></table>
<h2>Transaction Details</h2>
<table><thead><tr><th>Date</th><th>Customer</th><th>Type</th><th>Method</th><th>Cashier</th><th>Shift</th><th>Notes</th><th class="amount">Amount</th><th class="amount">Account Impact</th></tr></thead>
<tbody>${details || '<tr><td colspan="9">No transactions found for the selected filters.</td></tr>'}</tbody></table>
</body></html>`
}

function exportPaymentsToExcel(rows: CustomerPaymentReportRow[], metadata: PaymentsReportMetadata) {
    const workbook = XLSX.utils.book_new()
    const summary = [
        ["Customer Payments Report"],
        ["Shop", metadata.shopName],
        ["Period", `${metadata.startDate} to ${metadata.endDate}`],
        ["Cashier", metadata.cashierName],
        ["Shift", metadata.shiftName],
        ["Transaction type", metadata.typeName],
        ["Payment method", metadata.paymentName],
        ["Generated by", metadata.generatedBy],
        ["Transactions", rows.length],
        ["Net customer-account impact (KES)", metadata.signedTotal],
        [],
        ["Totals by transaction type"],
        ["Type", "Gross amount (KES)"],
        ...Object.entries(metadata.byType).sort(([left], [right]) => left.localeCompare(right)),
    ]
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), "Summary")
    const details = [
        ["Transaction ID", "Date", "Customer", "Type", "Reversal Of", "Payment Method", "Cashier", "Shift", "Notes", "Amount (KES)", "Account Impact (KES)"],
        ...rows.map((row) => [
            row.id,
            row.created_at || "",
            row.customerName || "Unknown Customer",
            row.type,
            row.reversal_of || "",
            row.payment_method,
            row.cashierName || row.cashierEmail || "User",
            row.shiftName || row.shift_id || "",
            row.notes || "",
            Number(row.amount),
            transactionImpact(row),
        ]),
    ]
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(details), "Transactions")
    XLSX.writeFile(workbook, `Customer_Payments_Report_${metadata.startDate}_${metadata.endDate}.xlsx`)
}
