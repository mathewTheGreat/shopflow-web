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
import { shiftService } from "@/services/shift.service"
import { Loader2, FileSpreadsheet, FileText, Printer } from "lucide-react"
import { toast } from "sonner"
import { Shift } from "@/types/shift"

interface FinancialBreakdownDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FinancialBreakdownDialog({ open, onOpenChange }: FinancialBreakdownDialogProps) {
  const userInfo = useAppStore((state) => state.userInfo)
  const activeShop = useAppStore((state) => state.activeShop)

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedShiftId, setSelectedShiftId] = useState<string>("")
  const [shifts, setShifts] = useState<Shift[]>([])
  const [isLoadingShifts, setIsLoadingShifts] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const fetchShifts = async () => {
      if (!activeShop?.id) return
      setIsLoadingShifts(true)
      try {
        const fetchedShifts = await shiftService.getShiftsByShopAndDate(activeShop.id, date)
        setShifts(fetchedShifts || [])
        if (fetchedShifts && fetchedShifts.length > 0) {
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
      const breakdown = await shiftService.getExpectedFinancials(selectedShiftId)
      console.log("breakdown", breakdown)

      let reconciliation = null
      try {
        const reconResponse: any = await shiftService.getShiftReconciliation(selectedShiftId)
        reconciliation = reconResponse
      } catch (e) {
        console.log('No reconciliation data available')
      }

      const selectedShift = shifts.find(s => s.id === selectedShiftId)
      const shiftName = selectedShift ? `Shift ${new Date(selectedShift.start_time).toLocaleTimeString()} - ${selectedShift.end_time ? new Date(selectedShift.end_time).toLocaleTimeString() : 'Ongoing'}` : 'Unknown Shift'

      const reportData = {
        shopName: activeShop?.name || "Unknown Shop",
        userName: userInfo?.name || "User",
        shiftManager: selectedShift?.manager_name || userInfo?.name || "User",
        shiftDate: date,
        shiftName: shiftName,
        shiftId: selectedShiftId,
        breakdown: breakdown,
        reconciliation: reconciliation
      }
      if (action === 'excel') {
        await exportFinancialBreakdownToExcel(reportData)
        toast.success("Excel report exported")
      } else {
        const html = formatFinancialBreakdownHTML(reportData)
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Financial Breakdown Report</DialogTitle>
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
                    {shift.manager_name || `Shift ${new Date(shift.start_time).toLocaleTimeString()}`}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {shift.end_time ? new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'})
                    </span>
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
            Preview
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
      </DialogContent>
    </Dialog>
  )
}

export function formatFinancialBreakdownHTML(report: any) {
  if (!report?.breakdown) {
    return "<div>No financial breakdown data available.</div>";
  }

  const b = report.breakdown;
  const r = report.reconciliation;

  const totalExpectedCash = b.totalExpectedCash;
  const totalExpectedMpesa = b.totalExpectedMpesa;
  const totalExpected = totalExpectedCash + totalExpectedMpesa;

  const actualCash = r?.actual_cash_amount || 0;
  const actualMpesa = r?.actual_mpesa_amount || 0;
  const totalActual = actualCash + actualMpesa;

  const cashVariance = actualCash - totalExpectedCash;
  const mpesaVariance = actualMpesa - totalExpectedMpesa;
  const totalVariance = cashVariance + mpesaVariance;

  const cashAccuracy =
    totalExpectedCash > 0
      ? (Math.abs(cashVariance) / totalExpectedCash) * 100
      : 0;

  const mpesaAccuracy =
    totalExpectedMpesa > 0
      ? (Math.abs(mpesaVariance) / totalExpectedMpesa) * 100
      : 0;

  const overallAccuracy =
    totalExpected > 0
      ? (Math.abs(totalVariance) / totalExpected) * 100
      : 0;

  const rating = (value: number) => {
    if (value <= 1) return "Excellent";
    if (value <= 3) return "Good";
    if (value <= 5) return "Fair";
    return "Needs Attention";
  };

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 0.5cm; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; line-height: 1.2; color: #000; background: white; margin: 0; padding: 0.5cm; }
  .report-header { text-align: center; border-bottom: 2px solid #2c5aa0; padding-bottom: 0.1cm; margin-bottom: 0.3cm; }
  .report-title { font-size: 16pt; font-weight: bold; color: #2c5aa0; margin: 0 0 0.05cm 0; }
  .report-subtitle { font-size: 10pt; color: #666; margin: 0.02cm 0; }
  .report-meta { display: flex; justify-content: space-between; background: #f8f9fa; padding: 0.2cm; border-radius: 4px; margin-bottom: 0.3cm; font-size: 8pt; flex-wrap: wrap; gap: 10px; border: 1px solid #eee; }
  .report-meta strong { color: #555; }
  
  .section-title { font-weight: bold; font-size: 11pt; margin: 0.4cm 0 0.2cm 0; padding-bottom: 0.1cm; border-bottom: 1px solid #e0e0e0; color: #2c5aa0; }
  
  table { width: 100%; border-collapse: collapse; margin-bottom: 0.3cm; font-size: 8.5pt; }
  th, td { border: 1px solid #eee; padding: 5px 8px; }
  th { background: #f0f4fa; text-align: center; color: #2c5aa0; font-weight: bold; }
  td:first-child { text-align: left; }
  td:not(:first-child) { text-align: right; }
  
  .total-row { font-weight: bold; background: #fcfcfc; }
  .grand-total { font-weight: bold; background: #e3f2fd; color: #1565c0; font-size: 9pt; }
  .variance-section { border: 1px solid #ffd54f; background: #fff8e6; padding: 0.2cm; border-radius: 4px; }
  .positive { color: #28a745; font-weight: bold; }
  .negative { color: #dc3545; font-weight: bold; }
  
  .reconciliation-box { border: 1px solid #4caf50; background: #e8f5e8; padding: 0.2cm; border-radius: 4px; }
  .summary-section { border: 1px solid #2196f3; background: #e3f2fd; padding: 0.2cm; border-radius: 4px; }
  .footer { text-align: center; margin-top: 0.5cm; padding-top: 0.2cm; border-top: 1px solid #eee; color: #888; font-size: 7.5pt; font-style: italic; }
</style>
</head>
<body>
  <div class="report-header">
    <h1 class="report-title">Financial Breakdown Report</h1>
    <div class="report-subtitle">${report.shopName} Branch</div>
    <div class="report-subtitle">${report.shiftDate} ${report.shiftName || ""}</div>
  </div>

  <div class="report-meta">
    <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
    <div><strong>Generated By:</strong> ${report.userName}</div>
    <div><strong>Shift Manager:</strong> ${report.shiftManager || "N/A"}</div>
  </div>

  <div class="section-title">Expected Financial Breakdown</div>
  <table>
  <thead>
  <tr>
    <th>Description</th>
    <th>Cash (KSh)</th>
    <th>Mpesa (KSh)</th>
  </tr>
  </thead>
  <tbody>
  <tr>
    <td>Opening Float</td>
    <td>${b.cashOpeningFloat.toFixed(2)}</td>
    <td>${b.mpesaOpeningFloat.toFixed(2)}</td>
  </tr>
  <tr>
    <td>Expected Sales</td>
    <td>${b.expectedCashSalesOnly.toFixed(2)}</td>
    <td>${b.expectedMpesaSalesOnly.toFixed(2)}</td>
  </tr>
  <tr>
    <td>Customer Ledger Inflows</td>
    <td>${b.customerCashInflows.toFixed(2)}</td>
    <td>${b.customerMpesaInflows.toFixed(2)}</td>
  </tr>
  <tr>
    <td>Additional Float</td>
    <td>${b.cashAdditionalFloat.toFixed(2)}</td>
    <td>${b.mpesaAdditionalFloat.toFixed(2)}</td>
  </tr>
  <tr>
    <td>Pay-Ins</td>
    <td>${b.cashPayIn.toFixed(2)}</td>
    <td>${b.mpesaPayIn.toFixed(2)}</td>
  </tr>
  <tr>
    <td>Expenses (Pay-Outs)</td>
    <td>-${b.cashPayOut.toFixed(2)}</td>
    <td>-${b.mpesaPayOut.toFixed(2)}</td>
  </tr>
  <tr class="total-row">
    <td>Total Expected</td>
    <td>${totalExpectedCash.toFixed(2)}</td>
    <td>${totalExpectedMpesa.toFixed(2)}</td>
  </tr>
  <tr class="grand-total">
    <td>Grand Total Expected</td>
    <td colspan="2">${totalExpected.toFixed(2)}</td>
  </tr>
  </tbody>
  </table>

  <div class="section-title">Actual Reconciliation</div>
  <table>
  <thead>
  <tr>
    <th>Description</th>
    <th>Cash (KSh)</th>
    <th>Mpesa (KSh)</th>
  </tr>
  </thead>
  <tbody>
  <tr>
    <td>Actual Amount Counted</td>
    <td>${actualCash.toFixed(2)}</td>
    <td>${actualMpesa.toFixed(2)}</td>
  </tr>
  <tr class="grand-total">
    <td>Total Actual</td>
    <td colspan="2">${totalActual.toFixed(2)}</td>
  </tr>
  </tbody>
  </table>

  <div class="section-title">Variance Analysis</div>
  <div class="variance-section">
    <table style="margin:0; border:none;">
    <thead>
    <tr>
      <th style="background:transparent; border:none; text-align:left; color:#e65100;">Description</th>
      <th style="background:transparent; border:none; color:#e65100;">Cash (KSh)</th>
      <th style="background:transparent; border:none; color:#e65100;">Mpesa (KSh)</th>
    </tr>
    </thead>
    <tbody>
    <tr>
      <td style="border:none;">Variance</td>
      <td style="border:none;" class="${cashVariance >= 0 ? "positive" : "negative"}">
        ${cashVariance.toFixed(2)} ${cashVariance >= 0 ? "(Surplus)" : "(Shortage)"}
      </td>
      <td style="border:none;" class="${mpesaVariance >= 0 ? "positive" : "negative"}">
        ${mpesaVariance.toFixed(2)} ${mpesaVariance >= 0 ? "(Surplus)" : "(Shortage)"}
      </td>
    </tr>
    <tr class="grand-total" style="background:transparent;">
      <td style="border:none;">Total Variance</td>
      <td style="border:none;" colspan="2" class="${totalVariance >= 0 ? "positive" : "negative"}">
        ${totalVariance.toFixed(2)} ${totalVariance >= 0 ? "(Surplus)" : "(Shortage)"}
      </td>
    </tr>
    </tbody>
    </table>
  </div>

  <div class="section-title">Reconciliation Status</div>
  <div class="reconciliation-box">
    Status: <strong style="color:${r?.status === "RECONCILED" ? "#28a745" : "#ffc107"};">
      ${r?.status || "PENDING"}
    </strong><br>
    Reconciled By: ${r?.reconciled_by || "Not reconciled"}<br>
    Reconciliation Date: ${r?.reconciliation_date ? new Date(r.reconciliation_date).toLocaleString() : "Not reconciled"}<br>
    ${r?.notes ? `Notes: ${r.notes}` : ""}
  </div>

  <div class="section-title">Performance Summary</div>
  <div class="summary-section">
    Cash Accuracy: ${cashAccuracy.toFixed(2)}% – ${rating(cashAccuracy)}<br>
    Mpesa Accuracy: ${mpesaAccuracy.toFixed(2)}% – ${rating(mpesaAccuracy)}<br>
    Overall Accuracy: ${overallAccuracy.toFixed(2)}% – ${rating(overallAccuracy)}
  </div>

  <div class="footer">
    Financial Breakdown Report generated on ${new Date().toLocaleString()} by ${report.userName}
  </div>
</body>
</html>
`;
}

async function exportFinancialBreakdownToExcel(report: any): Promise<void> {
  if (!report?.breakdown) {
    throw new Error('No financial breakdown data available');
  }

  const workbook = XLSX.utils.book_new();
  const finalFileName = `Financial_Breakdown_${report.shopName}_${report.shiftDate}.xlsx`;

  const b = report.breakdown;
  const r = report.reconciliation;

  const totalExpectedCash = b.totalExpectedCash;
  const totalExpectedMpesa = b.totalExpectedMpesa;
  const totalExpected = totalExpectedCash + totalExpectedMpesa;

  const actualCash = r?.actual_cash_amount || 0;
  const actualMpesa = r?.actual_mpesa_amount || 0;
  const totalActual = actualCash + actualMpesa;

  const cashVariance = actualCash - totalExpectedCash;
  const mpesaVariance = actualMpesa - totalExpectedMpesa;
  const totalVariance = cashVariance + mpesaVariance;

  const data: any[] = [];

  data.push(['FINANCIAL BREAKDOWN REPORT']);
  data.push([]);
  data.push(['Shop:', report.shopName]);
  data.push(['Shift Date:', report.shiftDate]);
  data.push(['Shift ID:', report.shiftId]);
  if (report.shiftName) data.push(['Shift Name:', report.shiftName]);
  data.push(['Generated By:', report.userName]);
  data.push(['Generated On:', new Date().toLocaleString()]);
  data.push([]);

  data.push(['EXPECTED FINANCIAL BREAKDOWN']);
  data.push([]);
  data.push(['Description', 'Cash (KES)', 'Mpesa (KES)']);

  data.push(['Expected Sales', b.expectedCashSalesOnly, b.expectedMpesaSalesOnly]);
  data.push(['Customer Ledger Inflows', b.customerCashInflows, b.customerMpesaInflows]);
  data.push(['Opening Float', b.cashOpeningFloat, b.mpesaOpeningFloat]);
  data.push(['Additional Float', b.cashAdditionalFloat, b.mpesaAdditionalFloat]);
  data.push(['Pay-Ins', b.cashPayIn, b.mpesaPayIn]);
  data.push(['Expenses (Pay-Outs)', -b.cashPayOut, -b.mpesaPayOut]);
  data.push(['TOTAL EXPECTED', totalExpectedCash, totalExpectedMpesa]);
  data.push(['GRAND TOTAL EXPECTED', totalExpected]);
  data.push([]);

  if (r) {
    data.push(['ACTUAL RECONCILIATION']);
    data.push([]);
    data.push(['Description', 'Cash (KES)', 'Mpesa (KES)']);
    data.push(['Actual Counted', actualCash, actualMpesa]);
    data.push(['TOTAL ACTUAL', totalActual]);
    data.push([]);

    data.push(['VARIANCE ANALYSIS']);
    data.push([]);
    data.push(['Description', 'Cash (KES)', 'Mpesa (KES)', 'Status']);
    data.push([
      'Variance',
      cashVariance,
      mpesaVariance,
      cashVariance >= 0 && mpesaVariance >= 0 ? 'Surplus' : 'Shortage'
    ]);
    data.push(['TOTAL VARIANCE', totalVariance]);
    data.push([]);

    data.push(['RECONCILIATION STATUS']);
    data.push(['Status', r.status]);
    data.push(['Reconciled By', r.reconciled_by || 'Not reconciled']);
    data.push([
      'Reconciliation Date',
      r.reconciliation_date
        ? new Date(r.reconciliation_date).toLocaleString()
        : 'Not reconciled'
    ]);
    data.push(['Notes', r.notes || 'No notes']);
    data.push([]);
  }

  if (r) {
    const overallVariance = totalActual - totalExpected;

    const cashAccuracy =
      totalExpectedCash > 0
        ? (Math.abs(cashVariance) / totalExpectedCash) * 100
        : 0;

    const mpesaAccuracy =
      totalExpectedMpesa > 0
        ? (Math.abs(mpesaVariance) / totalExpectedMpesa) * 100
        : 0;

    const overallAccuracy =
      totalExpected > 0
        ? (Math.abs(overallVariance) / totalExpected) * 100
        : 0;

    const rating = (value: number) => {
      if (value <= 1) return 'Excellent';
      if (value <= 3) return 'Good';
      if (value <= 5) return 'Fair';
      return 'Needs Attention';
    };

    data.push(['PERFORMANCE SUMMARY']);
    data.push(['Metric', 'Value', 'Rating']);
    data.push(['Cash Accuracy', `${cashAccuracy.toFixed(2)}%`, rating(cashAccuracy)]);
    data.push(['Mpesa Accuracy', `${mpesaAccuracy.toFixed(2)}%`, rating(mpesaAccuracy)]);
    data.push(['Overall Accuracy', `${overallAccuracy.toFixed(2)}%`, rating(overallAccuracy)]);
    data.push([]);
  }

  data.push(['REPORT NOTES']);
  data.push(['• Expected values are system-calculated']);
  data.push(['• Actual values are physically counted amounts']);
  data.push(['• Positive variance = surplus, Negative variance = shortage']);
  data.push([]);
  data.push(['Generated By:', report.userName]);
  data.push(['Timestamp:', new Date().toLocaleString()]);

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 35 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Breakdown');

  XLSX.writeFile(workbook, finalFileName);
}
