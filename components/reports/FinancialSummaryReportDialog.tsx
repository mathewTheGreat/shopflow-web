"use client"

import { useState } from "react"
import * as XLSX from "xlsx"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppStore } from "@/store/use-app-store"
import { shiftService } from "@/services/shift.service"
import { userService } from "@/services/user.service"
import { useQuery } from "@tanstack/react-query"
import { Loader2, FileSpreadsheet, FileText, Printer } from "lucide-react"
import { toast } from "sonner"
import { FinancialSummaryReport, FinancialSummaryExcelReport } from "@/types/financial-report"

interface FinancialSummaryReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function FinancialSummaryReportDialog({ open, onOpenChange }: FinancialSummaryReportDialogProps) {
    const userInfo = useAppStore((state) => state.userInfo)
    const activeShop = useAppStore((state) => state.activeShop)
    const activeShopId = activeShop?.id || ""

    const isManager = activeShop?.role?.toLowerCase() === 'manager'

    const [startDate, setStartDate] = useState(() => {
        const date = new Date()
        date.setDate(date.getDate() - 7)
        return date.toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedCashierId, setSelectedCashierId] = useState<string>("all")
    const [isGenerating, setIsGenerating] = useState(false)

    const { data: staff = [], isLoading: isLoadingStaff } = useQuery({
        queryKey: ["shop-staff-cashiers-financial", activeShopId],
        queryFn: () => userService.getUsersByRole("2fb92608-7257-485d-9c58-14ed6586d6b9", activeShopId),
        enabled: !!activeShopId && open,
    })

    const handleGenerateReport = async (action: 'preview' | 'excel' | 'pdf') => {
        if (!activeShopId) {
            toast.error("No shop selected")
            return
        }

        setIsGenerating(true)
        try {
            const reportData = await shiftService.getFinancialSummaryReport({
                shopId: activeShopId,
                startDate,
                endDate,
                cashierId: selectedCashierId === "all" ? undefined : selectedCashierId
            })

            const cashierName = selectedCashierId === "all"
                ? "All Cashiers"
                : (staff.find(s => s.id === selectedCashierId)?.name || "Unknown Cashier")

            if (action === 'excel') {
                await exportFinancialSummaryToExcel(
                    {
                        reportData,
                        shopName: activeShop?.name || "Unknown Shop",
                        userName: userInfo?.name || "User",
                        startDate,
                        endDate,
                        cashierFilter: cashierName
                    },
                    `Financial_Summary_Report_${startDate}_${endDate}.xlsx`
                )
                toast.success("Excel report exported")
            } else {
                const html = formatFinancialSummaryHTML(
                    reportData,
                    activeShop?.name || "Unknown Shop",
                    userInfo?.name || "User",
                    startDate,
                    endDate,
                    cashierName
                )

                const printWindow = window.open('', '_blank')
                if (printWindow) {
                    printWindow.document.write(html)
                    printWindow.document.close()
                } else {
                    toast.error("Pop-up blocked. Please allow pop-ups to view the report.")
                }
            }
        } catch (error) {
            console.error("Report generation failed:", error)
            toast.error("Failed to generate report")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Financial Summary Report</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Shop (Assigned to you)</Label>
                        <Input disabled value={activeShop?.name || "No shop selected"} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>From</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>To</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Cashier</Label>
                        <Select
                            value={selectedCashierId}
                            onValueChange={setSelectedCashierId}
                            disabled={!isManager}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingStaff ? "Loading..." : "Select cashier"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cashiers</SelectItem>
                                {staff.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name || s.email || "User"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {!isManager && (
                            <p className="text-xs text-muted-foreground">Only managers can filter by specific cashiers.</p>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleGenerateReport('preview')}
                        disabled={isGenerating}
                        className="w-full sm:w-auto bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                        Preview
                    </Button>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="default"
                            onClick={() => handleGenerateReport('excel')}
                            disabled={isGenerating}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Excel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => handleGenerateReport('preview')}
                            disabled={isGenerating}
                            className="flex-1"
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            PDF
                        </Button>
                    </div>
                </DialogFooter>
                <div className="text-xs text-muted-foreground text-center px-4">
                    View financial performance by cashier over a date range.
                </div>
            </DialogContent>
        </Dialog>
    )
}

function formatFinancialSummaryHTML(
    reportData: FinancialSummaryReport,
    shopName: string,
    userName: string,
    startDate: string,
    endDate: string,
    cashierFilter: string
) {
    if (!reportData?.summary) {
        return "<div class='report-error'>No financial data available.</div>";
    }

    const { summary, byCashier, shifts } = reportData;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
        });
    };

    const getAccuracyRating = (rate: number): string => {
        if (rate >= 98) return 'Excellent';
        if (rate >= 95) return 'Good';
        if (rate >= 90) return 'Fair';
        return 'Needs Attention';
    };

    const getRatingColor = (rate: number): string => {
        if (rate >= 98) return '#28a745';
        if (rate >= 95) return '#ffc107';
        if (rate >= 90) return '#fd7e14';
        return '#dc3545';
    };

    const fmt = (n: number) => n.toFixed(2);

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: A4; margin: 0.5cm; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; font-size: 8pt; line-height: 1.15; color: #000; background: white; }
        .report-container { width: 19.5cm; margin: 0 auto; box-sizing: border-box; padding: 0.5cm; }
        .report-header { text-align: center; border-bottom: 2px solid #2c5aa0; padding-bottom: 0.1cm; margin-bottom: 0.3cm; page-break-after: avoid; }
        .report-title { font-size: 14pt; font-weight: bold; color: #2c5aa0; margin: 0 0 0.05cm 0; }
        .report-subtitle { font-size: 9pt; color: #666; margin: 0.02cm 0; }
        .report-meta { display: flex; justify-content: space-between; background: #f8f9fa; padding: 0.15cm; border-radius: 3px; border: 1px solid #eee; margin-bottom: 0.3cm; font-size: 7pt; flex-wrap: wrap; gap: 8px; }
        .section-title { font-size: 10pt; font-weight: bold; color: #2c5aa0; margin: 0.3cm 0 0.15cm 0; padding-bottom: 0.1cm; border-bottom: 1px solid #e0e0e0; page-break-after: avoid; }
        .summary-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.2cm; margin: 0.2cm 0; page-break-after: avoid; }
        .summary-card { background: white; border: 1px solid #ddd; border-radius: 3px; padding: 0.2cm; text-align: center; page-break-inside: avoid; }
        .summary-value { font-size: 11pt; font-weight: bold; color: #2c5aa0; margin: 0.1cm 0; }
        .summary-label { font-size: 7pt; color: #666; text-transform: uppercase; }
        .positive { color: #28a745; }
        .negative { color: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 0.2cm 0; font-size: 7.5pt; page-break-inside: auto; }
        th { background-color: #2c5aa0; color: white; padding: 0.15cm; text-align: left; font-weight: bold; }
        td { padding: 0.12cm 0.1cm; border-bottom: 1px solid #eee; }
        tr { page-break-inside: avoid; }
        tr:nth-child(even) { background: #f8f9fa; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .footer { text-align: center; margin-top: 0.3cm; padding-top: 0.15cm; border-top: 1px solid #ddd; color: #666; font-style: italic; font-size: 6.5pt; page-break-before: avoid; }
        .cashier-section { background: #e8f5e8; border: 1px solid #4caf50; border-radius: 3px; padding: 0.2cm; margin: 0.2cm 0; page-break-inside: avoid; }
        .cashier-name { font-weight: bold; color: #1b5e20; margin-bottom: 0.15cm; font-size: 9pt; }
        .cashier-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.1cm; font-size: 7pt; }
        .cashier-stat { display: flex; justify-content: space-between; padding: 0.08cm; background: white; border-radius: 2px; }
        @media print { body { font-size: 8pt; } .report-container { padding: 0.5cm; } }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
          <h1 class="report-title">Financial Summary Report</h1>
          <div class="report-subtitle">${shopName} Branch</div>
          <div class="report-subtitle">${startDate} — ${endDate}</div>
        </div>

        <div class="report-meta">
          <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          <div><strong>Generated By:</strong> ${userName}</div>
          <div><strong>Cashier Filter:</strong> ${cashierFilter}</div>
        </div>
    `;

    html += `
        <div class="section-title">Overall Summary</div>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-value">${summary.totalShifts}</div>
            <div class="summary-label">Shifts</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">KES ${fmt(summary.totalExpected)}</div>
            <div class="summary-label">Total Expected</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">KES ${fmt(summary.totalActual)}</div>
            <div class="summary-label">Total Actual</div>
          </div>
          <div class="summary-card">
            <div class="summary-value" style="color: ${summary.totalVariance >= 0 ? '#28a745' : '#dc3545'}">KES ${fmt(summary.totalVariance)}</div>
            <div class="summary-label">Total Variance</div>
          </div>
          <div class="summary-card">
            <div class="summary-value" style="color: ${getRatingColor(summary.overallAccuracyRate)}">${summary.overallAccuracyRate.toFixed(1)}%</div>
            <div class="summary-label">Accuracy Rate</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">KES ${fmt(summary.totalCashPayOut)}</div>
            <div class="summary-label">Expenses</div>
          </div>
        </div>
    `;

    if (byCashier.length > 0) {
        html += `<div class="section-title">Performance by Cashier</div>`;

        byCashier.forEach(cashier => {
            html += `
                <div class="cashier-section">
                    <div class="cashier-name">${cashier.cashierName} (${cashier.shiftCount} shift${cashier.shiftCount > 1 ? 's' : ''})</div>
                    <div class="cashier-stats">
                        <div class="cashier-stat">
                            <span>Expected Cash:</span>
                            <strong>KES ${fmt(cashier.totalExpectedCash)}</strong>
                        </div>
                        <div class="cashier-stat">
                            <span>Expected Mpesa:</span>
                            <strong>KES ${fmt(cashier.totalExpectedMpesa)}</strong>
                        </div>
                        <div class="cashier-stat">
                            <span>Actual Cash:</span>
                            <strong>KES ${fmt(cashier.actualCashAmount)}</strong>
                        </div>
                        <div class="cashier-stat">
                            <span>Actual Mpesa:</span>
                            <strong>KES ${fmt(cashier.actualMpesaAmount)}</strong>
                        </div>
                        <div class="cashier-stat">
                            <span>Cash Variance:</span>
                            <strong class="${cashier.cashVariance >= 0 ? 'positive' : 'negative'}">KES ${fmt(cashier.cashVariance)}</strong>
                        </div>
                        <div class="cashier-stat">
                            <span>Mpesa Variance:</span>
                            <strong class="${cashier.mpesaVariance >= 0 ? 'positive' : 'negative'}">KES ${fmt(cashier.mpesaVariance)}</strong>
                        </div>
                        <div class="cashier-stat">
                            <span>Accuracy:</span>
                            <strong style="color: ${getRatingColor(cashier.accuracyRate)}">${cashier.accuracyRate.toFixed(1)}% (${getAccuracyRating(cashier.accuracyRate)})</strong>
                        </div>
                        <div class="cashier-stat">
                            <span>Expenses:</span>
                            <strong>KES ${fmt(cashier.cashPayOut + cashier.mpesaPayOut)}</strong>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    if (shifts.length > 0) {
        html += `
            <div class="section-title">All Shifts (${shifts.length})</div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Cashier</th>
                        <th class="text-right">Expected Cash</th>
                        <th class="text-right">Actual Cash</th>
                        <th class="text-right">Cash Var</th>
                        <th class="text-right">Expected Mpesa</th>
                        <th class="text-right">Actual Mpesa</th>
                        <th class="text-right">Mpesa Var</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        shifts.forEach(s => {
            html += `
                <tr>
                    <td>${formatDate(s.date)}</td>
                    <td>${s.cashierName}</td>
                    <td class="text-right">KES ${fmt(s.expectedCash)}</td>
                    <td class="text-right">KES ${fmt(s.actualCash)}</td>
                    <td class="text-right ${s.cashVariance >= 0 ? 'positive' : 'negative'}">KES ${fmt(s.cashVariance)}</td>
                    <td class="text-right">KES ${fmt(s.expectedMpesa)}</td>
                    <td class="text-right">KES ${fmt(s.actualMpesa)}</td>
                    <td class="text-right ${s.mpesaVariance >= 0 ? 'positive' : 'negative'}">KES ${fmt(s.mpesaVariance)}</td>
                    <td class="text-center">${s.status}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;
    }

    html += `
        <div class="footer">
            Financial Summary Report generated on ${new Date().toLocaleString()} by ${userName}
        </div>
      </div>
    </body>
    </html>
    `;

    return html;
}

const exportFinancialSummaryToExcel = async (
    report: FinancialSummaryExcelReport,
    fileName: string
): Promise<void> => {
    if (!report?.reportData) {
        throw new Error('No financial summary data available');
    }

    const workbook = XLSX.utils.book_new();
    const { reportData, shopName, userName, startDate, endDate, cashierFilter } = report;
    const { summary, byCashier, shifts } = reportData;

    const fmt = (n: number) => n.toFixed(2);

    // ==================== SUMMARY SHEET ====================
    const summaryData: any[][] = [
        ['FINANCIAL SUMMARY REPORT'],
        [],
        ['Shop:', shopName],
        ['Period:', `${startDate} to ${endDate}`],
        ['Generated By:', userName],
        ['Generated On:', new Date().toLocaleString()],
        ['Cashier Filter:', cashierFilter],
        [],
        ['OVERALL SUMMARY'],
        [],
        ['Metric', 'Value'],
        ['Total Shifts', summary.totalShifts],
        ['Total Expected (Cash)', summary.totalExpectedCash.toFixed(2)],
        ['Total Expected (Mpesa)', summary.totalExpectedMpesa.toFixed(2)],
        ['Total Expected (Combined)', summary.totalExpected.toFixed(2)],
        ['Total Actual (Cash)', summary.totalActualCash.toFixed(2)],
        ['Total Actual (Mpesa)', summary.totalActualMpesa.toFixed(2)],
        ['Total Actual (Combined)', summary.totalActual.toFixed(2)],
        ['Cash Variance', summary.totalCashVariance.toFixed(2)],
        ['Mpesa Variance', summary.totalMpesaVariance.toFixed(2)],
        ['Total Variance', summary.totalVariance.toFixed(2)],
        ['Accuracy Rate', `${summary.overallAccuracyRate.toFixed(1)}%`],
        [],
        ['BREAKDOWN'],
        ['Expected Cash Sales', summary.totalExpectedCashSales.toFixed(2)],
        ['Expected Mpesa Sales', summary.totalExpectedMpesaSales.toFixed(2)],
        ['Customer Cash Inflows', summary.totalCustomerCashInflows.toFixed(2)],
        ['Customer Mpesa Inflows', summary.totalCustomerMpesaInflows.toFixed(2)],
        ['Cash Opening Float', summary.totalCashOpeningFloat.toFixed(2)],
        ['Cash Additional Float', summary.totalCashAdditionalFloat.toFixed(2)],
        ['Cash Pay-In', summary.totalCashPayIn.toFixed(2)],
        ['Cash Pay-Out (Expenses)', summary.totalCashPayOut.toFixed(2)],
        ['Mpesa Opening Float', summary.totalMpesaOpeningFloat.toFixed(2)],
        ['Mpesa Additional Float', summary.totalMpesaAdditionalFloat.toFixed(2)],
        ['Mpesa Pay-In', summary.totalMpesaPayIn.toFixed(2)],
        ['Mpesa Pay-Out (Expenses)', summary.totalMpesaPayOut.toFixed(2)],
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');

    // ==================== CASHIER BREAKDOWN SHEET ====================
    if (byCashier.length > 0) {
        const cashierData: any[][] = [
            ['PERFORMANCE BY CASHIER'],
            [],
            ['Cashier', 'Shifts', 'Exp. Cash', 'Exp. Mpesa', 'Act. Cash', 'Act. Mpesa', 'Cash Var', 'Mpesa Var', 'Total Var', 'Accuracy %']
        ];

        byCashier.forEach(cashier => {
            cashierData.push([
                cashier.cashierName,
                cashier.shiftCount,
                cashier.totalExpectedCash.toFixed(2),
                cashier.totalExpectedMpesa.toFixed(2),
                cashier.actualCashAmount.toFixed(2),
                cashier.actualMpesaAmount.toFixed(2),
                cashier.cashVariance.toFixed(2),
                cashier.mpesaVariance.toFixed(2),
                cashier.totalVariance.toFixed(2),
                cashier.accuracyRate.toFixed(1) + '%'
            ]);
        });

        const cashierWs = XLSX.utils.aoa_to_sheet(cashierData);
        cashierWs['!cols'] = [{ wch: 25 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(workbook, cashierWs, 'By Cashier');
    }

    // ==================== SHIFT DETAILS SHEET ====================
    if (shifts.length > 0) {
        const shiftData: any[][] = [
            ['SHIFT DETAILS (Sorted by Largest Variance)'],
            [],
            ['Date', 'Cashier', 'Exp. Cash', 'Act. Cash', 'Cash Var', 'Exp. Mpesa', 'Act. Mpesa', 'Mpesa Var', 'Total Var', 'Status']
        ];

        shifts.forEach(s => {
            shiftData.push([
                new Date(s.date).toLocaleString(),
                s.cashierName,
                s.expectedCash.toFixed(2),
                s.actualCash.toFixed(2),
                s.cashVariance.toFixed(2),
                s.expectedMpesa.toFixed(2),
                s.actualMpesa.toFixed(2),
                s.mpesaVariance.toFixed(2),
                s.totalVariance.toFixed(2),
                s.status
            ]);
        });

        const shiftWs = XLSX.utils.aoa_to_sheet(shiftData);
        shiftWs['!cols'] = [{ wch: 22 }, { wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(workbook, shiftWs, 'Shift Details');
    }

    XLSX.writeFile(workbook, fileName);
}
