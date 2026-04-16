"use client"

import { useState, useEffect } from "react"
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
import { stockTakeService } from "@/services/stock-take.service"
import { userService } from "@/services/user.service"
import { useQuery } from "@tanstack/react-query"
import { Loader2, FileSpreadsheet, FileText, Printer, TrendingUp, TrendingDown, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { VarianceSummaryReport, VarianceSummaryExcelReport } from "@/types/stock-report"

interface VarianceSummaryReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function VarianceSummaryReportDialog({ open, onOpenChange }: VarianceSummaryReportDialogProps) {
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
        queryKey: ["shop-staff-cashiers", activeShopId],
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
            const reportData = await stockTakeService.getVarianceSummaryReport({
                shopId: activeShopId,
                startDate,
                endDate,
                cashierId: selectedCashierId === "all" ? undefined : selectedCashierId
            })

            const cashierName = selectedCashierId === "all"
                ? "All Cashiers"
                : (staff.find(s => s.id === selectedCashierId)?.name || "Unknown Cashier")

            if (action === 'excel') {
                await exportVarianceSummaryToExcel(
                    {
                        reportData,
                        shopName: activeShop?.name || "Unknown Shop",
                        userName: userInfo?.name || "User",
                        startDate,
                        endDate,
                        cashierFilter: cashierName
                    },
                    `Variance_Summary_Report_${startDate}_${endDate}.xlsx`
                )
                toast.success("Excel report exported")
            } else {
                const html = formatVarianceSummaryHTML(
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
                    <DialogTitle>Variance Summary Report</DialogTitle>
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
                    View stock variance summaries by cashier over a date range.
                </div>
            </DialogContent>
        </Dialog>
    )
}

function formatVarianceSummaryHTML(
    reportData: VarianceSummaryReport,
    shopName: string,
    userName: string,
    startDate: string,
    endDate: string,
    cashierFilter: string
) {
    if (!reportData?.summary) {
        return "<div class='report-error'>No variance data available.</div>";
    }

    const { summary, byCashier, stockTakes } = reportData;

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
        });
    };

    const getAccuracyRating = (rate: number): string => {
        if (rate >= 95) return 'Excellent';
        if (rate >= 85) return 'Good';
        if (rate >= 70) return 'Fair';
        return 'Needs Improvement';
    };

    const getRatingColor = (rate: number): string => {
        if (rate >= 95) return '#28a745';
        if (rate >= 85) return '#ffc107';
        if (rate >= 70) return '#fd7e14';
        return '#dc3545';
    };

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: A4; margin: 0.5cm; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0.5cm; font-size: 10pt; line-height: 1.2; color: #000; background: white; }
        .report-container { width: 100%; max-width: 21cm; margin: 0 auto; box-sizing: border-box; }
        .report-header { text-align: center; border-bottom: 2px solid #2c5aa0; padding-bottom: 0.1cm; margin-bottom: 0.3cm; page-break-after: avoid; }
        .report-title { font-size: 16pt; font-weight: bold; color: #2c5aa0; margin: 0 0 0.05cm 0; }
        .report-subtitle { font-size: 10pt; color: #666; margin: 0.02cm 0; }
        .report-meta { display: flex; justify-content: space-between; background: #f8f9fa; padding: 0.2cm; border-radius: 4px; border: 1px solid #eee; margin-bottom: 0.3cm; font-size: 8pt; flex-wrap: wrap; gap: 10px; }
        .section-title { font-size: 11pt; font-weight: bold; color: #2c5aa0; margin: 0.4cm 0 0.2cm 0; padding-bottom: 0.1cm; border-bottom: 1px solid #e0e0e0; page-break-after: avoid; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.3cm; margin: 0.3cm 0; page-break-after: avoid; }
        .summary-card { background: white; border: 1px solid #ddd; border-radius: 4px; padding: 0.3cm; text-align: center; page-break-inside: avoid; }
        .summary-value { font-size: 14pt; font-weight: bold; color: #2c5aa0; margin: 0.1cm 0; }
        .summary-label { font-size: 8pt; color: #666; text-transform: uppercase; }
        .positive { color: #28a745; }
        .negative { color: #dc3545; }
        .neutral { color: #6c757d; }
        table { width: 100%; border-collapse: collapse; margin: 0.3cm 0; font-size: 8pt; page-break-inside: auto; }
        th { background-color: #2c5aa0; color: white; padding: 0.2cm; text-align: left; font-weight: bold; }
        td { padding: 0.15cm; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #f8f9fa; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .footer { text-align: center; margin-top: 0.5cm; padding-top: 0.2cm; border-top: 1px solid #ddd; color: #666; font-style: italic; font-size: 7.5pt; }
        .rating-badge { padding: 2px 8px; border-radius: 4px; font-size: 7pt; font-weight: bold; color: white; }
        .cashier-section { background: #e8f5e8; border: 1px solid #4caf50; border-radius: 4px; padding: 0.3cm; margin: 0.3cm 0; page-break-inside: avoid; }
        .cashier-name { font-weight: bold; color: #1b5e20; margin-bottom: 0.2cm; }
        .cashier-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.15cm; font-size: 8pt; }
        .cashier-stat { display: flex; justify-content: space-between; padding: 0.1cm; background: white; border-radius: 3px; }
        .highlight-section { background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 0.3cm; margin: 0.3cm 0; page-break-inside: avoid; }
        .highlight-title { font-size: 10pt; font-weight: bold; color: #856404; margin-bottom: 0.2cm; }
        @media print { body { font-size: 9pt; } .report-container { padding: 0; margin: 0; } }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
          <h1 class="report-title">Variance Summary Report</h1>
          <div class="report-subtitle">${shopName} Branch</div>
          <div class="report-subtitle">${startDate} — ${endDate}</div>
        </div>
        
        <div class="report-meta">
          <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          <div><strong>Generated By:</strong> ${userName}</div>
          <div><strong>Cashier Filter:</strong> ${cashierFilter}</div>
        </div>
    `;

    // Overall Summary
    html += `
        <div class="section-title">Overall Summary</div>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-value">${summary.totalStockTakes}</div>
            <div class="summary-label">Stock Takes</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${summary.totalItems}</div>
            <div class="summary-label">Total Items</div>
          </div>
          <div class="summary-card">
            <div class="summary-value positive">${summary.overallPerfectMatches}</div>
            <div class="summary-label">Perfect Matches</div>
          </div>
          <div class="summary-card">
            <div class="summary-value negative">${summary.overallOverCounts + summary.overallUnderCounts}</div>
            <div class="summary-label">Items with Variance</div>
          </div>
          <div class="summary-card">
            <div class="summary-value" style="color: ${getRatingColor(summary.accuracyRate)}">${summary.accuracyRate.toFixed(1)}%</div>
            <div class="summary-label">Accuracy Rate</div>
          </div>
          <div class="summary-card">
            <div class="summary-value negative">${summary.totalAbsoluteVariance.toFixed(1)}</div>
            <div class="summary-label">Total Abs. Variance</div>
          </div>
        </div>
    `;

    // Per-Cashier Breakdown
    if (byCashier.length > 0) {
        html += `<div class="section-title">Performance by Cashier</div>`;
        
        byCashier.forEach(cashier => {
            html += `
                <div class="cashier-section">
                    <div class="cashier-name">${cashier.cashierName}</div>
                    <div class="cashier-stats">
                        <div class="cashier-stat">
                            <span>Stock Takes:</span>
                            <strong>${cashier.stockTakesCount}</strong>
                        </div>
                        <div class="cashier-stat">
                            <span>Items:</span>
                            <strong>${cashier.totalItems}</strong>
                        </div>
                        <div class="cashier-stat">
                            <span>Perfect:</span>
                            <strong class="positive">${cashier.perfectMatches}</strong>
                        </div>
                        <div class="cashier-stat">
                            <span>Over:</span>
                            <strong class="positive">${cashier.overCounts}</strong>
                        </div>
                        <div class="cashier-stat">
                            <span>Under:</span>
                            <strong class="negative">${cashier.underCounts}</strong>
                        </div>
                        <div class="cashier-stat">
                            <span>Accuracy:</span>
                            <strong style="color: ${getRatingColor(cashier.accuracyRate)}">${cashier.accuracyRate.toFixed(1)}%</strong>
                        </div>
                        <div class="cashier-stat">
                            <span>Avg Variance:</span>
                            <strong>${cashier.averageVariance.toFixed(2)}</strong>
                        </div>
                        <div class="cashier-stat">
                            <span>Total Abs. Var:</span>
                            <strong class="negative">${cashier.totalAbsoluteVariance.toFixed(1)}</strong>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    // Top Variances
    if (stockTakes.length > 0) {
        const topVariances = [...stockTakes]
            .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
            .slice(0, 10);

        html += `
            <div class="section-title">Top 10 Largest Variances</div>
            <table>
                <thead>
                    <tr>
                        <th>Date/Time</th>
                        <th>Cashier</th>
                        <th>Item</th>
                        <th class="text-right">Expected</th>
                        <th class="text-right">Counted</th>
                        <th class="text-right">Variance</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
        `;

        topVariances.forEach(item => {
            const varianceClass = item.variance > 0 ? 'positive' : item.variance < 0 ? 'negative' : 'neutral';
            html += `
                <tr>
                    <td>${formatTime(item.created_at)}</td>
                    <td>${item.cashierName}</td>
                    <td>${item.item_name}</td>
                    <td class="text-right">${item.expected_qty}</td>
                    <td class="text-right">${item.counted_qty}</td>
                    <td class="text-right ${varianceClass}">${item.variance > 0 ? '+' : ''}${item.variance}</td>
                    <td>${item.notes || '-'}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;
    }

    // Footer
    html += `
        <div class="footer">
            Variance Summary Report generated on ${new Date().toLocaleString()} by ${userName}
        </div>
      </div>
    </body>
    </html>
    `;

    return html;
}

const exportVarianceSummaryToExcel = async (
    report: VarianceSummaryExcelReport,
    fileName: string
): Promise<void> => {
    if (!report?.reportData) {
        throw new Error('No variance data available');
    }

    const workbook = XLSX.utils.book_new();
    const { reportData, shopName, userName, startDate, endDate, cashierFilter } = report;
    const { summary, byCashier, stockTakes } = reportData;

    // ==================== SUMMARY SHEET ====================
    const summaryData: any[][] = [
        ['VARIANCE SUMMARY REPORT'],
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
        ['Total Stock Takes', summary.totalStockTakes],
        ['Total Items Counted', summary.totalItems],
        ['Perfect Matches', summary.overallPerfectMatches],
        ['Over Counts', summary.overallOverCounts],
        ['Under Counts', summary.overallUnderCounts],
        ['Overall Accuracy Rate', `${summary.accuracyRate.toFixed(1)}%`],
        ['Total Absolute Variance', summary.totalAbsoluteVariance.toFixed(2)],
        ['Average Variance', summary.overallAverageVariance.toFixed(2)],
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');

    // ==================== CASHIER BREAKDOWN SHEET ====================
    if (byCashier.length > 0) {
        const cashierData: any[][] = [
            ['PERFORMANCE BY CASHIER'],
            [],
            ['Cashier Name', 'Stock Takes', 'Total Items', 'Perfect', 'Over', 'Under', 'Accuracy %', 'Avg Variance', 'Total Abs Variance']
        ];

        byCashier.forEach(cashier => {
            cashierData.push([
                cashier.cashierName,
                cashier.stockTakesCount,
                cashier.totalItems,
                cashier.perfectMatches,
                cashier.overCounts,
                cashier.underCounts,
                cashier.accuracyRate.toFixed(1) + '%',
                cashier.averageVariance.toFixed(2),
                cashier.totalAbsoluteVariance.toFixed(2)
            ]);
        });

        const cashierWs = XLSX.utils.aoa_to_sheet(cashierData);
        cashierWs['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(workbook, cashierWs, 'By Cashier');
    }

    // ==================== TOP VARIANCES SHEET ====================
    if (stockTakes.length > 0) {
        const topVariances = [...stockTakes]
            .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
            .slice(0, 20);

        const topData: any[][] = [
            ['TOP 20 LARGEST VARIANCES'],
            [],
            ['Rank', 'Date/Time', 'Cashier', 'Item Name', 'Expected', 'Counted', 'Variance', 'Variance %']
        ];

        topVariances.forEach((item, index) => {
            const variancePct = item.expected_qty !== 0 ? ((item.variance / item.expected_qty) * 100).toFixed(1) : '0.0';
            topData.push([
                index + 1,
                new Date(item.created_at).toLocaleString(),
                item.cashierName,
                item.item_name,
                item.expected_qty,
                item.counted_qty,
                item.variance,
                `${variancePct}%`
            ]);
        });

        const topWs = XLSX.utils.aoa_to_sheet(topData);
        topWs['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(workbook, topWs, 'Top Variances');
    }

    XLSX.writeFile(workbook, fileName);
}
