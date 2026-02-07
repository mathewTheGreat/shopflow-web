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
import { shiftService } from "@/services/shift.service"
import { Loader2, FileSpreadsheet, FileText, Printer } from "lucide-react"
import { toast } from "sonner"
import { VarianceReportData, VarianceExcelReport } from "@/types/stock-report"
import { Shift } from "@/types/shift"

interface VarianceReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VarianceReportDialog({ open, onOpenChange }: VarianceReportDialogProps) {
  const userInfo = useAppStore((state) => state.userInfo)
  const activeShop = useAppStore((state) => state.activeShop)

  // State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedShiftId, setSelectedShiftId] = useState<string>("")
  const [shifts, setShifts] = useState<Shift[]>([])
  const [isLoadingShifts, setIsLoadingShifts] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Fetch shifts when date or shop changes
  useEffect(() => {
    const fetchShifts = async () => {
      if (!activeShop?.id) return
      setIsLoadingShifts(true)
      try {
        const fetchedShifts = await shiftService.getShiftsByShopAndDate(activeShop.id, date)
        setShifts(fetchedShifts || [])
        // Reset selected shift if it's not in the new list
        if (fetchedShifts && fetchedShifts.length > 0) {
          // Optional: auto-select first shift or leave empty
          // setSelectedShiftId(fetchedShifts[0].id)
          setSelectedShiftId("")
        } else {
          setSelectedShiftId("")
        }
      } catch (error) {
        console.error("Failed to fetch shifts:", error)
        toast.error("Failed to fetch shifts")
        setShifts([])
      } finally {
        setIsLoadingShifts(false)
      }
    }

    if (open) {
      fetchShifts()
    }
  }, [open, date, activeShop?.id])

  const handleGenerateReport = async (action: 'preview' | 'excel' | 'pdf') => {
    if (!selectedShiftId) {
      toast.error("Please select a shift")
      return
    }

    setIsGenerating(true)
    try {
      const reportData = await stockTakeService.getVarianceReport(selectedShiftId)
      const selectedShift = shifts.find(s => s.id === selectedShiftId)
      const shiftName = selectedShift ? `Shift ${new Date(selectedShift.start_time).toLocaleTimeString()} - ${selectedShift.end_time ? new Date(selectedShift.end_time).toLocaleTimeString() : 'Ongoing'}` : 'Unknown Shift'


      if (action === 'excel') {
        // Calculate totalAbsoluteVariance inside the component before passing
        const totalAbsoluteVariance = reportData.stockTakes.reduce((sum, item) => sum + Math.abs(item.variance), 0)
        const enrichedReportData: VarianceReportData = {
          ...reportData,
          summary: {
            ...reportData.summary,
            totalAbsoluteVariance
          }
        }

        await exportVarianceReportToExcelWeb(
          {
            varianceData: enrichedReportData,
            shopName: activeShop?.name || "Unknown Shop",
            userName: userInfo?.name || "User",
            shiftDate: date,
            shiftName: shiftName,
            shiftId: selectedShiftId
          },
          `Variance_Report_${date}_${selectedShiftId.substring(0, 8)}.xlsx`
        )
        toast.success("Excel report exported")
      } else {
        // Preview or PDF (Print)
        const html = formatVarianceReportHTML(
          reportData,
          activeShop?.name || "Unknown Shop",
          userInfo?.name || "User",
          date,
          shiftName,
          selectedShiftId
        )

        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(html)
          printWindow.document.close()
          // printWindow.print() // Auto-print if desired
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Stock Variance Report</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Shop (Assigned to you)</Label>
            <Input disabled value={activeShop?.name || "No shop selected"} />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Shift</Label>
            <Select value={selectedShiftId} onValueChange={setSelectedShiftId} disabled={isLoadingShifts || shifts.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingShifts ? "Loading shifts..." : (shifts.length === 0 ? "No shifts found" : "Select shift")} />
              </SelectTrigger>
              <SelectContent>
                {shifts.map((shift) => (
                  <SelectItem key={shift.id} value={shift.id}>
                    {/*  Format: Shift HH:MM:SS (HH:MM - HH:MM) */}
                    Shift {new Date(shift.start_time).toLocaleTimeString()} ({new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {shift.end_time ? new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {shifts.length === 0 && !isLoadingShifts && (
              <p className="text-xs text-muted-foreground">Select a date to view shifts.</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleGenerateReport('preview')}
            disabled={isGenerating || !selectedShiftId}
            className="w-full sm:w-auto bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
            Preview PDF
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="default"
              onClick={() => handleGenerateReport('excel')}
              disabled={isGenerating || !selectedShiftId}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleGenerateReport('preview')}
              disabled={isGenerating || !selectedShiftId}
              className="flex-1"
            >
              <Printer className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </DialogFooter>
        <div className="text-xs text-muted-foreground text-center mt-2 px-4">
          Select a date, shop, and shift to generate variance reports. Data will be fetched automatically when you select a shift.
        </div>
      </DialogContent>
    </Dialog>
  )
}

// --- REPORT FORMATTING LOGIC ---

function formatVarianceReportHTML(
  varianceData: VarianceReportData,
  shopName: string,
  userName: string,
  shiftDate: string,
  shiftName?: string,
  shiftId?: string
) {
  if (!varianceData?.stockTakes) return "<div class='report-error'>No variance data available.</div>";

  const { summary, stockTakes } = varianceData;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        /* A4 Print Optimization */
        @page {
          size: A4;
          margin: 0.5cm;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 10pt;
          line-height: 1.2;
          color: #000;
          background: white;
        }
        
        .variance-report {
          width: 100%;
          max-width: 21cm;
          margin: 0 auto;
          padding: 0.5cm;
          box-sizing: border-box;
        }
        
        /* Header Styles */
        .report-header {
          text-align: center;
          border-bottom: 1px solid #2c5aa0;
          padding-bottom: 0.3cm;
          margin-bottom: 0.5cm;
          page-break-after: avoid;
        }
        
        .report-title {
          font-size: 14pt;
          font-weight: bold;
          color: #2c5aa0;
          margin: 0 0 0.2cm 0;
        }
        
        .report-subtitle {
          font-size: 9pt;
          color: #666;
          margin: 0.1cm 0;
        }
        
        .report-meta {
          display: flex;
          justify-content: space-between;
          background: #f8f9fa;
          padding: 0.3cm;
          border-radius: 3px;
          margin: 0.3cm 0;
          font-size: 8pt;
          page-break-after: avoid;
        }
        
        /* Section Styles */
        .section-title {
          font-size: 11pt;
          font-weight: bold;
          color: #2c5aa0;
          margin: 0.4cm 0 0.2cm 0;
          padding-bottom: 0.2cm;
          border-bottom: 1px solid #e0e0e0;
          page-break-after: avoid;
        }
        
        /* Summary Cards */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.3cm;
          margin: 0.3cm 0;
          page-break-after: avoid;
        }
        
        .summary-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 0.3cm;
          text-align: center;
          page-break-inside: avoid;
        }
        
        .summary-value {
          font-size: 14pt;
          font-weight: bold;
          color: #2c5aa0;
          margin: 0.1cm 0;
        }
        
        .summary-label {
          font-size: 8pt;
          color: #666;
          text-transform: uppercase;
        }
        
        .positive {
          color: #28a745;
        }
        
        .negative {
          color: #dc3545;
        }
        
        .neutral {
          color: #6c757d;
        }
        
        /* Variance Table */
        .variance-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.3cm 0;
          font-size: 8pt;
          page-break-inside: avoid;
        }
        
        .variance-table th {
          background: #2c5aa0;
          color: white;
          padding: 0.2cm;
          text-align: left;
          font-weight: bold;
        }
        
        .variance-table td {
          padding: 0.15cm;
          border-bottom: 1px solid #eee;
        }
        
        .variance-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        .variance-table tr:hover {
          background: #e3f2fd;
        }
        
        /* Status Indicators */
        .status-perfect {
          background: #d4edda;
          color: #155724;
          padding: 0.1cm 0.2cm;
          border-radius: 2px;
          font-weight: bold;
        }
        
        .status-over {
          background: #fff3cd;
          color: #856404;
          padding: 0.1cm 0.2cm;
          border-radius: 2px;
          font-weight: bold;
        }
        
        .status-under {
          background: #f8d7da;
          color: #721c24;
          padding: 0.1cm 0.2cm;
          border-radius: 2px;
          font-weight: bold;
        }
        
        /* Performance Section */
        .performance-section {
          background: #e8f5e8;
          border: 1px solid #4caf50;
          border-radius: 4px;
          padding: 0.3cm;
          margin: 0.4cm 0;
          page-break-inside: avoid;
        }
        
        .performance-title {
          font-size: 10pt;
          font-weight: bold;
          color: #2e7d32;
          margin-bottom: 0.2cm;
        }
        
        .performance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.2cm;
          font-size: 8pt;
        }
        
        .performance-item {
          display: flex;
          justify-content: space-between;
          padding: 0.1cm 0;
          border-bottom: 1px dashed #c8e6c9;
        }
        
        /* Recommendations */
        .recommendations {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 4px;
          padding: 0.3cm;
          margin: 0.3cm 0;
          page-break-inside: avoid;
        }
        
        .recommendations-title {
          font-size: 10pt;
          font-weight: bold;
          color: #856404;
          margin-bottom: 0.2cm;
        }
        
        .recommendation-item {
          padding: 0.1cm 0;
          border-bottom: 1px dashed #ffeaa7;
          font-size: 8pt;
        }
        
        /* Footer */
        .footer {
          text-align: center;
          margin-top: 0.5cm;
          padding-top: 0.3cm;
          border-top: 1px solid #ddd;
          color: #666;
          font-style: italic;
          font-size: 8pt;
          page-break-before: avoid;
        }
        
        /* Print-specific optimizations */
        @media print {
          body {
            font-size: 9pt;
          }
          
          .variance-report {
            padding: 0;
            margin: 0;
          }
          
          .summary-grid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .variance-table {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .section-title {
            page-break-after: avoid;
            break-after: avoid;
          }
          
          .report-header {
            page-break-after: avoid;
            break-after: avoid;
          }
        }
        
        /* Utility Classes */
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .bold {
          font-weight: bold;
        }
        
        .highlight {
          background: #fff3cd;
          padding: 0.2cm;
          border-radius: 3px;
          border-left: 3px solid #ffc107;
          margin: 0.2cm 0;
          font-size: 8pt;
        }
      </style>
    </head>
    <body onload="window.print()">
      <div class="variance-report">
        <div class="report-header">
          <h1 class="report-title">Stock Variance Report</h1>
          <div class="report-subtitle">${shopName} Branch</div>
          <div class="report-subtitle">${shiftDate}</div>
          ${shiftName ? `<div class="report-subtitle">${shiftName}</div>` : ''}
        </div>

        <div class="report-meta">
          <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          <div><strong>Shift Manager:</strong> ${userName}</div>
        </div>
  `;

  // === EXECUTIVE SUMMARY ===
  html += `<div class="section-title">Executive Summary</div>`;

  const accuracyPercentage = ((summary.perfectMatches / summary.totalItems) * 100).toFixed(1);
  const averageVarianceAbs = Math.abs(summary.averageVariance).toFixed(2);

  html += `
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-value">${summary.totalItems}</div>
        <div class="summary-label">Total Items</div>
      </div>
      <div class="summary-card">
        <div class="summary-value positive">${summary.perfectMatches}</div>
        <div class="summary-label">Perfect Matches</div>
      </div>
      <div class="summary-card">
        <div class="summary-value negative">${summary.overCounts + summary.underCounts}</div>
        <div class="summary-label">Items with Variance</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${accuracyPercentage}%</div>
        <div class="summary-label">Accuracy Rate</div>
      </div>
      <div class="summary-card">
        <div class="summary-value ${summary.averageVariance === 0 ? 'neutral' : summary.averageVariance > 0 ? 'positive' : 'negative'}">
          ${summary.averageVariance > 0 ? '+' : ''}${summary.averageVariance.toFixed(2)}
        </div>
        <div class="summary-label">Avg Variance</div>
      </div>
      <div class="summary-card">
        <div class="summary-value ${summary.maxVariance === 0 ? 'neutral' : summary.maxVariance > 0 ? 'positive' : 'negative'}">
          ${summary.maxVariance > 0 ? '+' : ''}${summary.maxVariance}
        </div>
        <div class="summary-label">Max Variance</div>
      </div>
    </div>
  `;

  // === VARIANCE ANALYSIS TABLE ===
  html += `<div class="section-title">Variance Analysis by Item</div>`;

  if (stockTakes.length === 0) {
    html += `<div class="highlight">No stock count data available for this shift</div>`;
  } else {
    html += `
      <table class="variance-table">
        <thead>
          <tr>
            <th>Item Name</th>
            <th class="text-right">Expected</th>
            <th class="text-right">Counted</th>
            <th class="text-right">Variance</th>
            <th class="text-center">Status</th>
            <th class="text-right">Variance %</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
    `;

    let totalExpected = 0;
    let totalCounted = 0;
    let totalVariance = 0;

    stockTakes.forEach(item => {
      const variance = item.variance;
      const variancePercentage = item.expected_qty !== 0 ? ((variance / item.expected_qty) * 100).toFixed(1) : (variance === 0 ? "0.0" : "100.0");
      const status = variance > 0 ? 'status-over' : variance < 0 ? 'status-under' : 'status-perfect';
      const statusText = variance > 0 ? 'OVER' : variance < 0 ? 'UNDER' : 'PERFECT';

      totalExpected += item.expected_qty;
      totalCounted += item.counted_qty;
      totalVariance += variance;

      html += `
        <tr>
          <td>${item.item_name}</td>
          <td class="text-right">${item.expected_qty}</td>
          <td class="text-right">${item.counted_qty}</td>
          <td class="text-right ${variance > 0 ? 'positive' : variance < 0 ? 'negative' : 'neutral'}">
            ${variance > 0 ? '+' : ''}${variance}
          </td>
          <td class="text-center"><span class="${status}">${statusText}</span></td>
          <td class="text-right ${Math.abs(parseFloat(variancePercentage)) > 10 ? 'negative' : 'neutral'}">
            ${variance > 0 ? '+' : ''}${variancePercentage}%
          </td>
          <td>${item.notes || '-'}</td>
        </tr>
      `;
    });

    // Totals row
    const totalVariancePercentage = totalExpected !== 0 ? ((totalVariance / totalExpected) * 100).toFixed(1) : (totalVariance === 0 ? "0.0" : "100.0");
    html += `
        <tr style="background: #e3f2fd; font-weight: bold;">
          <td>TOTALS</td>
          <td class="text-right">${totalExpected}</td>
          <td class="text-right">${totalCounted}</td>
          <td class="text-right ${totalVariance > 0 ? 'positive' : totalVariance < 0 ? 'negative' : 'neutral'}">
            ${totalVariance > 0 ? '+' : ''}${totalVariance}
          </td>
          <td class="text-center">-</td>
          <td class="text-right ${Math.abs(parseFloat(totalVariancePercentage)) > 5 ? 'negative' : 'neutral'}">
            ${totalVariance > 0 ? '+' : ''}${totalVariancePercentage}%
          </td>
          <td>-</td>
        </tr>
      </tbody>
      </table>
    `;
  }

  // === PERFORMANCE METRICS ===
  html += `
    <div class="performance-section">
      <div class="performance-title">Performance Metrics</div>
      <div class="performance-grid">
  `;

  // Calculate performance ratings
  const getAccuracyRating = (rate: number): string => {
    if (rate >= 95) return '🟢 Excellent';
    if (rate >= 85) return '🟡 Good';
    if (rate >= 70) return '🟠 Fair';
    return '🔴 Needs Improvement';
  };

  const getVarianceRating = (variance: number): string => {
    if (variance <= 1) return '🟢 Excellent';
    if (variance <= 3) return '🟡 Good';
    if (variance <= 5) return '🟠 Fair';
    return '🔴 Needs Attention';
  };

  html += `
        <div class="performance-item">
          <span>Counting Accuracy:</span>
          <span class="bold">${accuracyPercentage}%</span>
        </div>
        <div class="performance-item">
          <span>Rating:</span>
          <span>${getAccuracyRating(parseFloat(accuracyPercentage))}</span>
        </div>
        <div class="performance-item">
          <span>Average Variance:</span>
          <span class="bold">${averageVarianceAbs}</span>
        </div>
        <div class="performance-item">
          <span>Rating:</span>
          <span>${getVarianceRating(parseFloat(averageVarianceAbs))}</span>
        </div>
        <div class="performance-item">
          <span>Items with Variance:</span>
          <span class="bold">${summary.overCounts + summary.underCounts}</span>
        </div>
        <div class="performance-item">
          <span>Perfect Matches:</span>
          <span class="bold">${summary.perfectMatches}</span>
        </div>
      </div>
    </div>
  `;

  // === TOP VARIANCES ===
  const topVariances = [...stockTakes]
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, 5);

  if (topVariances.length > 0) {
    html += `<div class="section-title">Top 5 Largest Variances</div>`;
    html += `<table class="variance-table">`;
    html += `
      <thead>
        <tr>
          <th>Rank</th>
          <th>Item Name</th>
          <th class="text-right">Expected</th>
          <th class="text-right">Counted</th>
          <th class="text-right">Variance</th>
          <th class="text-right">Variance %</th>
        </tr>
      </thead>
      <tbody>
    `;

    topVariances.forEach((item, index) => {
      const variancePercentage = item.expected_qty !== 0 ? ((item.variance / item.expected_qty) * 100).toFixed(1) : (item.variance === 0 ? "0.0" : "100.0");
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${item.item_name}</td>
          <td class="text-right">${item.expected_qty}</td>
          <td class="text-right">${item.counted_qty}</td>
          <td class="text-right ${item.variance > 0 ? 'positive' : 'negative'}">
            ${item.variance > 0 ? '+' : ''}${item.variance}
          </td>
          <td class="text-right ${Math.abs(parseFloat(variancePercentage)) > 10 ? 'negative' : 'neutral'}">
            ${item.variance > 0 ? '+' : ''}${variancePercentage}%
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
  }

  // === RECOMMENDATIONS ===
  html += `
    <div class="recommendations">
      <div class="recommendations-title">Recommendations & Action Items</div>
  `;

  if (parseFloat(accuracyPercentage) < 70) {
    html += `<div class="recommendation-item">🚨 <strong>Priority:</strong> Counting procedures need immediate review and improvement</div>`;
  } else if (parseFloat(accuracyPercentage) < 85) {
    html += `<div class="recommendation-item">⚠️ <strong>Attention:</strong> Some counting inconsistencies detected - review needed</div>`;
  } else {
    html += `<div class="recommendation-item">✅ <strong>Good:</strong> Counting accuracy is within acceptable range</div>`;
  }

  if (summary.overCounts > summary.underCounts) {
    html += `<div class="recommendation-item">📊 <strong>Trend:</strong> More over-counts than under-counts - check counting methodology</div>`;
  } else if (summary.underCounts > summary.overCounts) {
    html += `<div class="recommendation-item">📊 <strong>Trend:</strong> More under-counts than over-counts - potential shrinkage risk</div>`;
  }

  if (topVariances.length > 0) {
    html += `<div class="recommendation-item">💡 <strong>Focus:</strong> Review counting procedures for: ${topVariances.slice(0, 3).map(item => item.item_name).join(', ')}</div>`;
  }

  html += `<div class="recommendation-item">📋 <strong>Action:</strong> Investigate items with variance percentage greater than 10%</div>`;
  html += `</div>`;

  // Footer
  html += `
        <div class="footer">
          Variance Report generated on ${new Date().toLocaleString()} by ${userName}<br>
          <small>Note: Variance = Counted Quantity - Expected Quantity | Positive = Over-count, Negative = Under-count</small>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

const exportVarianceReportToExcelWeb = async (
  report: VarianceExcelReport,
  fileName: string
): Promise<void> => {
  if (!report?.varianceData) {
    throw new Error('No variance data available');
  }

  const workbook = XLSX.utils.book_new();

  const data: any[] = [];

  // ==================== HEADER SECTION ====================
  data.push(['STOCK VARIANCE REPORT']);
  data.push([]);
  data.push(['Shop:', report.shopName]);
  data.push(['Shift Date:', report.shiftDate]);
  data.push(['Shift ID:', report.shiftId]);
  if (report.shiftName) {
    data.push(['Shift Name:', report.shiftName]);
  }
  data.push(['Generated by:', report.userName]);
  data.push(['Generated on:', new Date().toLocaleString()]);
  data.push(['Report Type:', 'Stock Count Variance Analysis']);
  data.push([]);

  // ==================== EXECUTIVE SUMMARY ====================
  data.push(['EXECUTIVE SUMMARY']);
  data.push([]);
  data.push(['Metric', 'Value']);
  data.push(['Total Items Counted', report.varianceData.summary.totalItems]);
  data.push(['Perfect Matches', report.varianceData.summary.perfectMatches]);
  data.push(['Over Counts', report.varianceData.summary.overCounts]);
  data.push(['Under Counts', report.varianceData.summary.underCounts]);
  data.push(['Total Absolute Variance', Math.abs(report.varianceData.summary.totalAbsoluteVariance)]);
  data.push(['Average Variance', Number(report.varianceData.summary.averageVariance.toFixed(2))]);
  data.push(['Maximum Variance', Math.abs(report.varianceData.summary.maxVariance)]);

  // Calculate accuracy percentage
  const accuracyPercentage = report.varianceData.summary.totalItems > 0 ? ((report.varianceData.summary.perfectMatches / report.varianceData.summary.totalItems) * 100).toFixed(1) : "0.0";
  data.push(['Accuracy Rate', `${accuracyPercentage}%`]);
  data.push([]);

  // ==================== VARIANCE ANALYSIS ====================
  data.push(['VARIANCE ANALYSIS BY ITEM']);
  data.push([]);
  data.push([
    'Item Name',
    'Expected Qty',
    'Counted Qty',
    'Variance',
    'Variance Type',
    'Absolute Variance',
    'Variance %',
    'Notes'
  ]);

  let totalExpected = 0;
  let totalCounted = 0;
  let totalVariance = 0;

  report.varianceData.stockTakes.forEach(item => {
    const variance = item.variance;
    const varianceType = variance > 0 ? 'Over Count' : variance < 0 ? 'Under Count' : 'Perfect Match';
    const absoluteVariance = Math.abs(variance);
    const variancePercentage = item.expected_qty !== 0 ? ((variance / item.expected_qty) * 100).toFixed(1) : (variance === 0 ? "0.0" : "100.0");

    totalExpected += item.expected_qty;
    totalCounted += item.counted_qty;
    totalVariance += variance;

    data.push([
      item.item_name,
      item.expected_qty,
      item.counted_qty,
      variance,
      varianceType,
      absoluteVariance,
      `${variancePercentage}%`,
      item.notes || 'N/A'
    ]);
  });

  // Add totals row
  data.push([
    'TOTALS',
    totalExpected,
    totalCounted,
    totalVariance,
    '',
    Math.abs(totalVariance),
    `${totalExpected !== 0 ? ((totalVariance / totalExpected) * 100).toFixed(1) : (totalVariance === 0 ? "0.0" : "100.0")}%`,
    ''
  ]);
  data.push([]);

  // ==================== TOP VARIANCES ====================
  data.push(['TOP 10 LARGEST VARIANCES (BY ABSOLUTE VALUE)']);
  data.push([]);
  data.push(['Rank', 'Item Name', 'Expected', 'Counted', 'Variance', 'Variance %']);

  // Sort by absolute variance descending and take top 10
  const topVariances = [...report.varianceData.stockTakes]
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, 10);

  topVariances.forEach((item, index) => {
    const variancePercentage = item.expected_qty !== 0 ? ((item.variance / item.expected_qty) * 100).toFixed(1) : (item.variance === 0 ? "0.0" : "100.0");
    data.push([
      index + 1,
      item.item_name,
      item.expected_qty,
      item.counted_qty,
      item.variance,
      `${variancePercentage}%`
    ]);
  });
  data.push([]);

  // ==================== PERFORMANCE METRICS ====================
  data.push(['PERFORMANCE METRICS']);
  data.push([]);
  data.push(['Metric', 'Value', 'Rating']);

  const accuracyRate = report.varianceData.summary.totalItems > 0 ? (report.varianceData.summary.perfectMatches / report.varianceData.summary.totalItems) * 100 : 0;
  const averageVarianceAbs = Math.abs(report.varianceData.summary.averageVariance);

  const getAccuracyRating = (rate: number): string => {
    if (rate >= 95) return 'Excellent';
    if (rate >= 85) return 'Good';
    if (rate >= 70) return 'Fair';
    return 'Needs Improvement';
  };

  const getVarianceRating = (variance: number): string => {
    if (variance <= 1) return 'Excellent';
    if (variance <= 3) return 'Good';
    if (variance <= 5) return 'Fair';
    return 'Needs Attention';
  };

  data.push(['Counting Accuracy', `${accuracyRate.toFixed(1)}%`, getAccuracyRating(accuracyRate)]);
  data.push(['Average Variance', averageVarianceAbs.toFixed(2), getVarianceRating(averageVarianceAbs)]);
  data.push(['Max Variance', Math.abs(report.varianceData.summary.maxVariance), getVarianceRating(Math.abs(report.varianceData.summary.maxVariance))]);
  data.push(['Items with Variance', `${report.varianceData.summary.overCounts + report.varianceData.summary.underCounts} items`, '']);
  data.push([]);

  // Create worksheet with the data
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Apply column widths for better readability
  const colWidths = [
    { wch: 25 }, // Item Name / Metric
    { wch: 12 }, // Expected Qty / Value
    { wch: 12 }, // Counted Qty
    { wch: 12 }, // Variance
    { wch: 15 }, // Variance Type
    { wch: 15 }, // Absolute Variance
    { wch: 12 }, // Variance %
    { wch: 25 }  // Notes
  ];
  worksheet['!cols'] = colWidths;

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Variance Report');

  // Download File
  XLSX.writeFile(workbook, fileName);
}
