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

function sumByPaymentMethod(rows: CustomerPaymentReportRow[]): Record<string, number> {
    return rows.reduce<Record<string, number>>((totals, row) => {
        totals[row.payment_method] = (totals[row.payment_method] || 0) + Number(row.cash_inflow_impact || 0)
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
    const [flow, setFlow] = useState<"INFLOWS" | "ALL">("INFLOWS")
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
                flow,
            })
            const byType = sumByType(rows)
            const signedTotal = rows.reduce((total, row) => total + transactionImpact(row), 0)
            const cashInflowTotal = rows.reduce((total, row) => total + Number(row.cash_inflow_impact || 0), 0)
            const inflowsByMethod = sumByPaymentMethod(rows)
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
                flowName: flow === "INFLOWS" ? "Customer cash inflows" : "All customer-account activity",
                signedTotal,
                cashInflowTotal,
                inflowsByMethod,
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
                <DialogHeader><DialogTitle>Customer Payments &amp; Inflows Report</DialogTitle></DialogHeader>

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
                        <Label>Report view</Label>
                        <Select value={flow} onValueChange={(value) => setFlow(value as "INFLOWS" | "ALL")}>
                            <SelectTrigger><SelectValue placeholder="Select report view" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INFLOWS">Customer inflows only (matches shift financials)</SelectItem>
                                <SelectItem value="ALL">All customer-account activity</SelectItem>
                            </SelectContent>
                        </Select>
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
                        Customer inflows include payments/refunds/adjustments posted to cash or M-Pesa, less reversals. Credit-sale charges do not count as cash received. Selecting a shift includes entries attributed to that shift even if they were recorded later.
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
    flowName: string
    signedTotal: number
    cashInflowTotal: number
    inflowsByMethod: Record<string, number>
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
            <td>${escapeHtml(row.recorded_by_name || row.cashierName || "User")}</td>
            <td>${escapeHtml(row.notes || "-")}</td>
            <td class="amount">${escapeHtml(formatAmount(Number(row.amount)))}</td>
            <td class="amount">${escapeHtml(formatAmount(transactionImpact(row)))}</td>
            <td class="amount">${escapeHtml(formatAmount(Number(row.cash_inflow_impact || 0)))}</td>
        </tr>`).join("")
    const typeTotals = Object.entries(metadata.byType)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([label, amount]) => `<tr><td>${escapeHtml(label)}</td><td class="amount">${escapeHtml(formatAmount(amount))}</td></tr>`)
        .join("")

    const methodTotals = Object.entries(metadata.inflowsByMethod)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([label, amount]) => `<tr><td>${escapeHtml(label)}</td><td class="amount">${escapeHtml(formatAmount(amount))}</td></tr>`)
        .join("")

    return `<!doctype html><html><head><meta charset="utf-8"><title>Customer Payments &amp; Inflows Report</title>
<style>
@page{size:A4 landscape;margin:0.5cm}
*{box-sizing:border-box}
body{font:9pt Arial,sans-serif;color:#222;margin:0}
.report-container{max-width:29.7cm;margin:0 auto}
.report-header{text-align:center;border-bottom:2px solid #2c5aa0;padding-bottom:0.15cm;margin-bottom:0.3cm}
.report-title{font-size:16pt;font-weight:bold;color:#2c5aa0;margin:0 0 0.05cm}
.report-subtitle{font-size:9pt;color:#666;margin:0.02cm 0}
.report-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px 14px;background:#f8f9fa;padding:0.25cm;border-radius:4px;margin-bottom:0.3cm;font-size:8pt;border:1px solid #eee}
.report-meta strong{color:#555}
.summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0.3cm 0}
.summary-item{background:#f0f4fa;border:1px solid #dce5f2;border-radius:4px;padding:0.2cm;text-align:center}
.summary-value{font-size:11pt;font-weight:bold;color:#2c5aa0;margin:0.08cm 0}
.summary-label{font-size:8pt;color:#666}
.report-note{color:#666;font-size:8pt;margin:0.2cm 0}
.section-title{font-weight:bold;font-size:11pt;margin:0.4cm 0 0.2cm;padding-bottom:0.1cm;border-bottom:1px solid #e0e0e0;color:#2c5aa0}
table{width:100%;border-collapse:collapse;margin-bottom:0.3cm;font-size:8pt}
th,td{border:1px solid #eee;padding:5px 7px;text-align:left;vertical-align:top}
th{background:#f0f4fa;color:#2c5aa0;font-weight:bold}
tbody tr:nth-child(even){background:#f8f9fa}
.amount{text-align:right;white-space:nowrap}
.empty{text-align:center;color:#666;padding:14px}
.footer{text-align:center;margin-top:0.5cm;padding-top:0.2cm;border-top:1px solid #eee;color:#888;font-size:7.5pt;font-style:italic}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.report-container{max-width:none}}
</style></head><body>
<main class="report-container">
<header class="report-header">
 <h1 class="report-title">Customer Payments &amp; Inflows Report</h1>
 <div class="report-subtitle">${escapeHtml(metadata.shopName)} Branch</div>
 <div class="report-subtitle">${escapeHtml(metadata.startDate)} — ${escapeHtml(metadata.endDate)}</div>
</header>
<section class="report-meta">
 <div><strong>Generated:</strong> ${escapeHtml(new Date().toLocaleString("en-KE"))}</div>
 <div><strong>Generated By:</strong> ${escapeHtml(metadata.generatedBy)}</div>
 <div><strong>Cashier:</strong> ${escapeHtml(metadata.cashierName)}</div>
 <div><strong>Shift:</strong> ${escapeHtml(metadata.shiftName)}</div>
 <div><strong>Transaction type:</strong> ${escapeHtml(metadata.typeName)}</div>
 <div><strong>Payment method:</strong> ${escapeHtml(metadata.paymentName)}</div>
 <div><strong>Report view:</strong> ${escapeHtml(metadata.flowName)}</div>
</section>
<section class="summary-grid">
 <div class="summary-item"><div class="summary-value">${rows.length}</div><div class="summary-label">Transactions</div></div>
 <div class="summary-item"><div class="summary-value">${escapeHtml(formatAmount(metadata.signedTotal))}</div><div class="summary-label">Net Customer-Account Impact</div></div>
 <div class="summary-item"><div class="summary-value">${escapeHtml(formatAmount(metadata.cashInflowTotal))}</div><div class="summary-label">Net Customer Inflows</div></div>
</section>
<p class="report-note">Cash inflows match the Customer Inflows bucket in shift financial breakdown. Reversal entries reduce the original inflow; account charges that did not move money show zero cash impact.</p>
<h2 class="section-title">Net Customer Inflows by Payment Method</h2>
<table><thead><tr><th>Payment Method</th><th class="amount">Net Inflow</th></tr></thead><tbody>${methodTotals || '<tr><td colspan="2" class="empty">No customer inflows</td></tr>'}</tbody></table>
<h2 class="section-title">Totals by Transaction Type</h2>
<table><thead><tr><th>Type</th><th class="amount">Gross Amount</th></tr></thead><tbody>${typeTotals || '<tr><td colspan="2" class="empty">No transactions</td></tr>'}</tbody></table>
<h2 class="section-title">Transaction Details</h2>
<table><thead><tr><th>Date/Time</th><th>Customer</th><th>Type</th><th>Method</th><th>Shift Cashier</th><th>Responsible Shift</th><th>Recorded By</th><th>Notes</th><th class="amount">Amount</th><th class="amount">Account Impact</th><th class="amount">Cash Inflow</th></tr></thead>
<tbody>${details || '<tr><td colspan="11" class="empty">No transactions found for the selected filters.</td></tr>'}</tbody></table>
<footer class="footer">Generated on ${escapeHtml(new Date().toLocaleString("en-KE"))}</footer>
</main></body></html>`
}

function exportPaymentsToExcel(rows: CustomerPaymentReportRow[], metadata: PaymentsReportMetadata) {
    const workbook = XLSX.utils.book_new()
    const summary = [
        ["Customer Payments & Inflows Report"],
        ["Shop", metadata.shopName],
        ["Period", `${metadata.startDate} to ${metadata.endDate}`],
        ["Cashier", metadata.cashierName],
        ["Shift", metadata.shiftName],
        ["Transaction type", metadata.typeName],
        ["Payment method", metadata.paymentName],
        ["Report view", metadata.flowName],
        ["Generated by", metadata.generatedBy],
        ["Transactions", rows.length],
        ["Net customer-account impact (KES)", metadata.signedTotal],
        ["Net customer inflows (KES)", metadata.cashInflowTotal],
        [],
        ["Net customer inflows by payment method"],
        ["Payment method", "Net inflow (KES)"],
        ...Object.entries(metadata.inflowsByMethod).sort(([left], [right]) => left.localeCompare(right)),
        [],
        ["Totals by transaction type"],
        ["Type", "Gross amount (KES)"],
        ...Object.entries(metadata.byType).sort(([left], [right]) => left.localeCompare(right)),
    ]
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), "Summary")
    const details = [
        ["Transaction ID", "Date", "Customer", "Type", "Reversal Of", "Payment Method", "Shift Cashier", "Responsible Shift", "Recorded By", "Notes", "Amount (KES)", "Account Impact (KES)", "Cash Inflow (KES)"],
        ...rows.map((row) => [
            row.id,
            row.created_at || "",
            row.customerName || "Unknown Customer",
            row.type,
            row.reversal_of || "",
            row.payment_method,
            row.cashierName || row.cashierEmail || "User",
            row.shiftName || row.shift_id || "",
            row.recorded_by_name || "",
            row.notes || "",
            Number(row.amount),
            transactionImpact(row),
            Number(row.cash_inflow_impact || 0),
        ]),
    ]
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(details), "Transactions")
    XLSX.writeFile(workbook, `Customer_Payments_Report_${metadata.startDate}_${metadata.endDate}.xlsx`)
}
