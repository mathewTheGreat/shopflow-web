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
import { useSuppliers } from "@/hooks/use-supplier"
import { useAppStore } from "@/store/use-app-store"
import { supplierService } from "@/services/supplier.service"
import { Loader2, FileSpreadsheet, FileText, Printer } from "lucide-react"
import { toast } from "sonner"

interface SupplierDeliveryReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SupplierDeliveryReportDialog({ open, onOpenChange }: SupplierDeliveryReportDialogProps) {
    const userInfo = useAppStore((state) => state.userInfo)
    const activeShop = useAppStore((state) => state.activeShop)

    // State
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>("all")
    const [isGenerating, setIsGenerating] = useState(false)

    // Data Hooks
    const { data: suppliers = [] } = useSuppliers()

    const handleGenerateReport = async (action: 'preview' | 'excel' | 'pdf') => {
        setIsGenerating(true)
        try {
            const supplierIdArg = selectedSupplierId === "all" ? undefined : selectedSupplierId
            const reportData = await supplierService.getSupplierDeliveries(supplierIdArg, startDate, endDate)

            const supplierName = selectedSupplierId === "all"
                ? "All Suppliers"
                : suppliers.find(s => s.id === selectedSupplierId)?.name || "Unknown Supplier"

            if (action === 'excel') {
                await exportSupplierDeliveriesToExcelWeb(
                    reportData,
                    activeShop?.name || "Unknown Shop",
                    userInfo?.name || "User",
                    new Date(startDate),
                    new Date(endDate),
                    supplierName,
                    `Supplier_Deliveries_${startDate}_${endDate}.xlsx`
                )
                toast.success("Excel report exported")
            } else {
                // Preview or PDF (Print)
                const html = formatSupplierDeliveriesHTML(
                    reportData,
                    activeShop?.name || "Unknown Shop",
                    userInfo?.name || "User",
                    new Date(startDate),
                    new Date(endDate),
                    supplierName
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
                    <DialogTitle>Supplier Deliveries Report</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
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
                        <Label>Supplier</Label>
                        <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Suppliers</SelectItem>
                                {suppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
            </DialogContent>
        </Dialog>
    )
}

// --- REPORT LOGIC (Adapted from user request) ---

const formatSupplierDeliveriesHTML = (
    deliveries: any[],
    shopName: string,
    managerName: string,
    startDate: Date,
    endDate: Date,
    supplierFilter: string
): string => {
    const formatTime = (timeString: string) => {
        const date = new Date(timeString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
    };

    const totalItems = deliveries.reduce((sum, delivery) => sum + (delivery.quantity || 0), 0);
    const totalValue = deliveries.reduce((sum, delivery) => {
        const quantity = delivery.quantity || 0;
        const price = delivery.unit_price || delivery.price || 0;
        return sum + (quantity * price);
    }, 0);

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
        .supplier-report { width: 100%; max-width: 21cm; margin: 0 auto; padding: 0.5cm; box-sizing: border-box; }
        .header { text-align: center; margin-bottom: 0.4cm; border-bottom: 2px solid #2c3e50; padding-bottom: 0.3cm; }
        .header h1 { margin: 0 0 0.2cm 0; color: #2c3e50; font-size: 14pt; font-weight: bold; }
        .report-info { background: #f8f9fa; padding: 0.3cm; border-radius: 4px; margin: 0.3cm 0; font-size: 8pt; }
        .report-info p { margin: 0.1cm 0; display: flex; justify-content: space-between; }
        .summary { margin-bottom: 0.3cm; background: #e8f5e8; padding: 0.3cm; border-radius: 4px; border: 1px solid #4caf50; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.2cm; font-size: 9pt; }
        .summary-item { text-align: center; padding: 0.2cm; background: white; border-radius: 3px; border: 1px solid #ddd; }
        .summary-value { font-size: 11pt; font-weight: bold; color: #2c3e50; margin: 0.1cm 0; }
        .summary-label { font-size: 8pt; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 0.3cm; font-size: 8pt; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        th { background-color: #2c3e50; color: white; padding: 0.3cm 0.2cm; text-align: left; font-weight: bold; font-size: 8pt; border: 1px solid #1a252f; }
        td { padding: 0.2cm; border-bottom: 1px solid #ddd; border: 1px solid #e0e0e0; }
        tr:nth-child(even) { background-color: #f8f9fa; }
        .text-right { text-align: right; }
        .total-row { background-color: #e3f2fd !important; font-weight: bold; border-top: 2px solid #2196f3; }
        .footer { text-align: center; margin-top: 0.4cm; padding-top: 0.3cm; border-top: 1px solid #ddd; color: #666; font-style: italic; font-size: 8pt; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="supplier-report">
        <div class="header"><h1>Supplier Deliveries Report</h1></div>
        <div class="report-info">
          <p><strong>Period:</strong> ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</p>
          <p><strong>Supplier Filter:</strong> ${supplierFilter}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div class="summary">
          <div class="summary-grid">
            <div class="summary-item"><div class="summary-value">${deliveries.length}</div><div class="summary-label">Total Deliveries</div></div>
            <div class="summary-item"><div class="summary-value">${totalItems}</div><div class="summary-label">Total Items</div></div>
            <div class="summary-item"><div class="summary-value">KES ${totalValue.toFixed(2)}</div><div class="summary-label">Total Value</div></div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Time</th><th>Item Name</th><th class="text-right">Quantity</th><th>Supplier</th><th>Receiver</th><th class="text-right">Unit Price</th><th class="text-right">Total Value</th>
            </tr>
          </thead>
          <tbody>
            ${deliveries.length > 0 ? deliveries.map(delivery => {
        const quantity = delivery.quantity || 0;
        const unitPrice = delivery.unit_price || delivery.price || 0;
        const tv = quantity * unitPrice;
        return `<tr>
                  <td>${formatTime(delivery.time)}</td>
                  <td>${delivery.item || 'N/A'}</td>
                  <td class="text-right">${quantity}</td>
                  <td>${delivery.supplier_name || 'N/A'}</td>
                  <td>${delivery.receiver || 'N/A'}</td>
                  <td class="text-right">KES ${unitPrice.toFixed(2)}</td>
                  <td class="text-right">KES ${tv.toFixed(2)}</td>
                </tr>`;
    }).join('') : `<tr><td colspan="7" style="text-align:center; padding:10px;">No delivery data found</td></tr>`}
          </tbody>
          ${deliveries.length > 0 ? `
            <tfoot>
              <tr class="total-row">
                <td colspan="2"><strong>Grand Total</strong></td>
                <td class="text-right"><strong>${totalItems}</strong></td>
                <td colspan="3"></td>
                <td class="text-right"><strong>KES ${totalValue.toFixed(2)}</strong></td>
              </tr>
            </tfoot>` : ''}
        </table>
        <div class="footer">Supplier Deliveries Report generated on ${new Date().toLocaleString()} by ${managerName}</div>
      </div>
    </body>
    </html>
  `;
};

// Adapted for Web (removed expo dependencies)
const exportSupplierDeliveriesToExcelWeb = async (
    deliveries: any[],
    shopName: string,
    managerName: string,
    startDate: Date,
    endDate: Date,
    supplierFilter: string,
    fileName: string
): Promise<void> => {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();

    // Prepare data for Excel
    const excelData = [
        ['Supplier Deliveries Report'],
        [],
        ['Report Information'],
        ['Period:', `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`],
        ['Supplier Filter:', supplierFilter],
        ['Generated:', new Date().toLocaleString()],
        ['Total Deliveries:', deliveries.length],
        ['Total Items Received:', deliveries.reduce((sum, delivery) => sum + (delivery.quantity || 0), 0)],
        [],
        ['Time', 'Item', 'Quantity', 'Supplier', 'Receiver', 'Unit Price', 'Total Value']
    ];

    deliveries.forEach(delivery => {
        const deliveryDate = new Date(delivery.time);
        const formattedTime = deliveryDate.toLocaleString();
        const unitPrice = delivery.unit_price || delivery.price || 0;

        excelData.push([
            formattedTime,
            delivery.item || 'N/A',
            delivery.quantity || 0,
            delivery.supplier_name || 'N/A',
            delivery.receiver || 'N/A',
            unitPrice,
            (delivery.quantity || 0) * unitPrice
        ]);
    });

    if (deliveries.length === 0) {
        excelData.push(['No delivery data found for the selected period']);
    }

    const ws = XLSX.utils.aoa_to_sheet(excelData);

    const colWidths = [
        { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 15 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Supplier Deliveries');
    XLSX.writeFile(wb, fileName);
};
