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
import { customerPaymentService } from "@/services/customer-payment.service"
import { useCustomersByShop } from "@/hooks/use-customers"
import { Loader2, FileSpreadsheet, FileText, Printer, UserCircle } from "lucide-react"
import { toast } from "sonner"
import { CustomerNetPositionReport, NetPositionTransaction } from "@/types/customer-report"

interface CustomerNetPositionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CustomerNetPositionDialog({ open, onOpenChange }: CustomerNetPositionDialogProps) {
    const userInfo = useAppStore((state) => state.userInfo)
    const activeShop = useAppStore((state) => state.activeShop)

    // State
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
    const [isGenerating, setIsGenerating] = useState(false)

    // Data Hooks
    const { data: customers = [] } = useCustomersByShop(activeShop?.id || "")

    const handleGenerateReport = async (action: 'preview' | 'excel' | 'pdf') => {
        if (!selectedCustomerId) {
            toast.error("Please select a customer")
            return
        }

        setIsGenerating(true)
        try {
            const reportData = await customerPaymentService.getNetPosition(
                selectedCustomerId,
                startDate,
                endDate
            )

            const customerName = customers.find(c => c.id === selectedCustomerId)?.name || "Unknown Customer"
            const shopName = activeShop?.name || "Unknown Shop"

            if (action === 'excel') {
                await exportToExcelWeb(
                    reportData,
                    shopName,
                    customerName,
                    userInfo?.name || "User",
                    startDate,
                    endDate,
                    `Net_Position_${customerName}_${startDate}_${endDate}.xlsx`
                )
                toast.success("Excel report exported")
            } else {
                // Preview or PDF (Print)
                const html = formatReportHTML(
                    reportData,
                    shopName,
                    customerName,
                    userInfo?.name || "User",
                    startDate,
                    endDate
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Customer Net Position Report</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Customer</Label>
                        <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((customer) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                        <div className="flex items-center gap-2">
                                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                                            <span>{customer.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleGenerateReport('preview')}
                        disabled={isGenerating}
                        className="w-full sm:w-auto bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
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
            </DialogContent>
        </Dialog>
    )
}

function formatReportHTML(
    report: CustomerNetPositionReport,
    shopName: string,
    customerName: string,
    generatedBy: string,
    startDate: string,
    endDate: string
) {
    const { account, openingBalance, closingBalance, transactions } = report;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
        });
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: A4; margin: 0.5cm; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 0; padding: 0; font-size: 10pt; line-height: 1.2; color: #000; background: white;
        }
        .report-container { width: 100%; max-width: 21cm; margin: 0 auto; padding: 0.5cm; box-sizing: border-box; }
        .header { text-align: center; margin-bottom: 0.4cm; border-bottom: 2px solid #2c3e50; padding-bottom: 0.3cm; }
        .header h1 { margin: 0 0 0.1cm 0; color: #2c3e50; font-size: 16pt; }
        .header h2 { margin: 0; color: #666; font-size: 10pt; font-weight: normal; }
        
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5cm; margin: 0.4cm 0; font-size: 9pt; }
        .info-box { background: #f8f9fa; padding: 0.3cm; border-radius: 4px; border: 1px solid #eee; }
        .info-box strong { color: #2c3e50; display: block; margin-bottom: 2px; text-transform: uppercase; font-size: 7pt; }
        
        .balance-summary { 
            display: flex; justify-content: space-between; gap: 0.3cm; margin: 0.4cm 0;
            background: #2c3e50; color: white; padding: 0.4cm; border-radius: 4px;
        }
        .balance-item { text-align: center; flex: 1; }
        .balance-label { font-size: 7pt; text-transform: uppercase; opacity: 0.8; margin-bottom: 4px; }
        .balance-value { font-size: 12pt; font-weight: bold; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 0.4cm; font-size: 8.5pt; }
        th { background: #f4f4f4; color: #333; padding: 0.25cm 0.2cm; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold; }
        td { padding: 0.2cm; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background-color: #fafafa; }
        
        .type-badge { padding: 2px 6px; border-radius: 3px; font-size: 7pt; font-weight: bold; text-transform: uppercase; }
        .type-CREDIT { background: #e8f5e9; color: #2e7d32; }
        .type-DEBIT { background: #ffebee; color: #c62828; }
        
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .footer { text-align: center; margin-top: 0.6cm; padding-top: 0.3cm; border-top: 1px solid #eee; font-size: 8pt; color: #888; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="report-container">
        <div class="header">
          <h1>Customer Net Position</h1>
          <h2>${shopName}</h2>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <strong>Customer</strong>
            ${customerName}
          </div>
          <div class="info-box">
            <strong>Period</strong>
            ${startDate} to ${endDate}
          </div>
        </div>

        <div class="balance-summary">
          <div class="balance-item">
            <div class="balance-label">Opening Balance</div>
            <div class="balance-value">${formatCurrency(openingBalance)}</div>
          </div>
          <div class="balance-item" style="border-left: 1px solid rgba(255,255,255,0.2); border-right: 1px solid rgba(255,255,255,0.2);">
            <div class="balance-label">Net Activity</div>
            <div class="balance-value">${formatCurrency(closingBalance - openingBalance)}</div>
          </div>
          <div class="balance-item">
            <div class="balance-label">Closing Balance</div>
            <div class="balance-value">${formatCurrency(closingBalance)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Type</th>
              <th>Method</th>
              <th>Description/Notes</th>
              <th class="text-right">Amount</th>
              <th class="text-right">Running Balance</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.length > 0 ? transactions.map(t => `
              <tr>
                <td>${formatDateTime(t.created_at)}</td>
                <td><span class="type-badge type-${t.type}">${t.type}</span></td>
                <td>${t.payment_method}</td>
                <td>
                    <div class="font-bold">${t.notes || 'No notes'}</div>
                    <div style="font-size: 7pt; color: #666;">By: ${t.created_by_name}</div>
                </td>
                <td class="text-right ${t.type === 'DEBIT' ? 'color: #c62828;' : 'color: #2e7d32;'}">
                    ${t.type === 'DEBIT' ? '-' : '+'}${t.amount.toLocaleString()}
                </td>
                <td class="text-right font-bold">${t.runningBalance.toLocaleString()}</td>
              </tr>
            `).join('') : '<tr><td colspan="6" style="text-align:center; padding: 1cm; color: #888;">No transactions found for this period.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Generated by ${generatedBy} on ${new Date().toLocaleString()}
        </div>
      </div>
    </body>
    </html>
    `;
}

const exportToExcelWeb = async (
    report: CustomerNetPositionReport,
    shopName: string,
    customerName: string,
    generatedBy: string,
    startDate: string,
    endDate: string,
    fileName: string
): Promise<void> => {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
        ['CUSTOMER NET POSITION REPORT'],
        [],
        ['Shop:', shopName],
        ['Customer:', customerName],
        ['Period:', `${startDate} to ${endDate}`],
        ['Generated By:', generatedBy],
        ['Date Generated:', new Date().toLocaleString()],
        [],
        ['Financial Summary'],
        ['Opening Balance', report.openingBalance],
        ['Closing Balance', report.closingBalance],
        ['Net Activity', report.closingBalance - report.openingBalance],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');

    // Transactions Sheet
    const transactionData = [
        ['Date', 'Time', 'Type', 'Method', 'Reference/Notes', 'Staff', 'Amount', 'Running Balance']
    ];

    report.transactions.forEach(t => {
        const dt = new Date(t.created_at);
        transactionData.push([
            dt.toLocaleDateString(),
            dt.toLocaleTimeString(),
            t.type,
            t.payment_method,
            t.notes || '',
            t.created_by_name,
            t.type === 'DEBIT' ? -t.amount : t.amount,
            t.runningBalance
        ]);
    });

    const txWs = XLSX.utils.aoa_to_sheet(transactionData);
    txWs['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(workbook, txWs, 'Transactions');

    XLSX.writeFile(workbook, fileName);
};
