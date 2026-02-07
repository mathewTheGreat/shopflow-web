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
import { saleService } from "@/services/sale.service"
import { userService } from "@/services/user.service"
import { useCustomersByShop } from "@/hooks/use-customers"
import { useShops } from "@/hooks/use-shops"
import { useQuery } from "@tanstack/react-query"
import { Loader2, FileSpreadsheet, FileText, Printer } from "lucide-react"
import { toast } from "sonner"
import { SaleReport } from "@/types/sales-report"

interface SalesReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SalesReportDialog({ open, onOpenChange }: SalesReportDialogProps) {
    const userInfo = useAppStore((state) => state.userInfo)
    const activeShop = useAppStore((state) => state.activeShop)

    const isManager = activeShop?.role?.toLowerCase() === 'manager'

    // State
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedShopId, setSelectedShopId] = useState<string>(activeShop?.id || "")
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all")
    const [selectedCashierId, setSelectedCashierId] = useState<string>("all")
    const [selectedSaleCategory, setSelectedSaleCategory] = useState<string>("all")
    const [isGenerating, setIsGenerating] = useState(false)

    // Sync with active shop when dialog opens
    useEffect(() => {
        if (open && activeShop?.id) {
            setSelectedShopId(activeShop.id)
            if (!isManager && userInfo?.id) {
                setSelectedCashierId(userInfo.id)
            }
        }
    }, [open, activeShop, isManager, userInfo])

    // Data Hooks
    const { data: shops = [] } = useShops()
    const { data: customers = [] } = useCustomersByShop(selectedShopId)

    const { data: staff = [], isLoading: isLoadingStaff } = useQuery({
        queryKey: ["shop-staff", selectedShopId, "CASHIER"],
        queryFn: () => userService.getUsersByRole("2fb92608-7257-485d-9c58-14ed6586d6b9", selectedShopId),
        enabled: !!selectedShopId && open,
    })

    const handleGenerateReport = async (action: 'preview' | 'excel' | 'pdf') => {
        if (!selectedShopId) {
            toast.error("Please select a shop")
            return
        }

        setIsGenerating(true)
        try {
            const reportData = await saleService.getSalesReport({
                shopId: selectedShopId,
                startDate,
                endDate,
                cashierId: selectedCashierId,
                customerId: selectedCustomerId,
                saleCategory: selectedSaleCategory
            })

            const shopName = shops.find(s => s.id === selectedShopId)?.name || activeShop?.name || "Unknown Shop"
            const customerName = selectedCustomerId === "all" ? "All Customers" : customers.find(c => c.id === selectedCustomerId)?.name || "Unknown"
            const selectedStaff = staff.find(s => s.id === selectedCashierId)
            const cashierName = selectedCashierId === "all"
                ? "All Cashiers"
                : (selectedStaff?.name || selectedStaff?.email || (selectedCashierId === userInfo?.id ? (userInfo?.name || userInfo?.email) : null) || "User")
            const categoryName = selectedSaleCategory === "all" ? "All Categories" : selectedSaleCategory

            if (action === 'excel') {
                await exportSalesToExcelWeb(
                    reportData,
                    shopName,
                    userInfo?.name || "User",
                    startDate,
                    endDate,
                    customerName,
                    categoryName,
                    cashierName,
                    `Sales_Report_${startDate}_${endDate}.xlsx`
                )
                toast.success("Excel report exported")
            } else {
                // Preview or PDF (Print)
                const html = formatSalesReportHTML(
                    reportData,
                    shopName,
                    userInfo?.name || "User",
                    startDate,
                    endDate,
                    customerName,
                    categoryName,
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sales Report</DialogTitle>
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
                        <Label>Shop</Label>
                        <Select
                            value={selectedShopId}
                            onValueChange={setSelectedShopId}
                            disabled={!isManager}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select shop" />
                            </SelectTrigger>
                            <SelectContent>
                                {shops.map((shop) => (
                                    <SelectItem key={shop.id} value={shop.id}>
                                        {shop.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                        {s.name || s.email || (s.id === userInfo?.id ? (userInfo?.name || userInfo?.email) : null) || "User"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Customer</Label>
                        <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Customers</SelectItem>
                                {customers.map((customer) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Sale Category</Label>
                        <Select value={selectedSaleCategory} onValueChange={setSelectedSaleCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="IMMEDIATE">Immediate (Cash/Mpesa)</SelectItem>
                                <SelectItem value="CREDIT">Credit</SelectItem>
                                <SelectItem value="PREPAID">Prepaid</SelectItem>
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


// --- REPORT LOGIC ---

function formatSalesReportHTML(
    sales: SaleReport[],
    shopName: string,
    managerName: string,
    startDate: string,
    endDate: string,
    customerFilter: string,
    categoryFilter: string,
    cashierFilter: string
) {
    const totalAmount = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.saleItems.reduce((is, item) => is + item.quantity, 0), 0);

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
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
        .header h1 { margin: 0 0 0.2cm 0; color: #2c3e50; font-size: 14pt; font-weight: bold; }
        .report-info { background: #f8f9fa; padding: 0.3cm; border-radius: 4px; margin: 0.3cm 0; font-size: 8pt; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
        .summary { margin-bottom: 0.3cm; background: #e8f5e8; padding: 0.3cm; border-radius: 4px; border: 1px solid #4caf50; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.2cm; font-size: 9pt; }
        .summary-item { text-align: center; padding: 0.2cm; background: white; border-radius: 3px; border: 1px solid #ddd; }
        .summary-value { font-size: 11pt; font-weight: bold; color: #2c3e50; margin: 0.1cm 0; }
        .summary-label { font-size: 8pt; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 0.3cm; font-size: 8pt; }
        th { background-color: #2c3e50; color: white; padding: 0.2cm; text-align: left; font-weight: bold; }
        td { padding: 0.2cm; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background-color: #f8f9fa; }
        .text-right { text-align: right; }
        .badge { padding: 2px 6px; border-radius: 4px; font-size: 7pt; font-weight: bold; }
        .badge-IMMEDIATE { background: #e3f2fd; color: #0d47a1; }
        .badge-CREDIT { background: #ffebee; color: #c62828; }
        .badge-PREPAID { background: #e8f5e9; color: #1b5e20; }
        .footer { text-align: center; margin-top: 0.4cm; padding-top: 0.3cm; border-top: 1px solid #ddd; color: #666; font-style: italic; font-size: 8pt; }
        .items-list { font-size: 7.5pt; color: #555; margin-top: 2px; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="report-container">
        <div class="header">
            <h1>Sales Report</h1>
            <div style="font-size: 10pt; color: #666;">${shopName}</div>
        </div>
        
        <div class="report-info">
            <div>
                <strong>Date Range:</strong> ${startDate} to ${endDate}<br>
                <strong>Generated By:</strong> ${managerName}
            </div>
            <div>
                <strong>Customer Filter:</strong> ${customerFilter}<br>
                <strong>Category Filter:</strong> ${categoryFilter}<br>
                <strong>Cashier Filter:</strong> ${cashierFilter}
            </div>
        </div>

        <div class="summary">
          <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-value">${sales.length}</div>
                <div class="summary-label">Total Transactions</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${totalItems}</div>
                <div class="summary-label">Items Sold</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">KES ${totalAmount.toLocaleString()}</div>
                <div class="summary-label">Total Revenue</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Customer</th>
              <th>Category</th>
              <th>Cashier</th>
              <th>Items</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${sales.length > 0 ? sales.map(sale => `
              <tr>
                <td>${formatTime(sale.sale_date)}</td>
                <td>${sale.customer?.name || 'Walk-in'}</td>
                <td><span class="badge badge-${sale.sale_category}">${sale.sale_category}</span></td>
                <td>${sale.createdBy?.name || sale.createdBy?.email || 'User'}</td>
                <td>
                    <div class="items-list">
                        ${sale.saleItems.map(item => `${item.quantity}x ${item.item.name}`).join(', ')}
                    </div>
                </td>
                <td class="text-right font-bold">KES ${sale.total_amount.toLocaleString()}</td>
              </tr>
            `).join('') : '<tr><td colspan="6" style="text-align:center; padding: 20px;">No sales found for the selected period.</td></tr>'}
          </tbody>
          <tfoot>
            <tr style="background: #e3f2fd; font-weight: bold; border-top: 2px solid #2196f3;">
                <td colspan="5" class="text-right">GRAND TOTAL</td>
                <td class="text-right">KES ${totalAmount.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
            Generated on ${new Date().toLocaleString()}
        </div>
      </div>
    </body>
    </html>
    `;
}

const exportSalesToExcelWeb = async (
    sales: SaleReport[],
    shopName: string,
    managerName: string,
    startDate: string,
    endDate: string,
    customerFilter: string,
    categoryFilter: string,
    cashierFilter: string,
    fileName: string
): Promise<void> => {
    const workbook = XLSX.utils.book_new();

    // --- SUMMARY SHEET ---
    const summaryData = [
        ['SALES REPORT Summary'],
        [],
        ['Shop Name:', shopName],
        ['Period:', `${startDate} to ${endDate}`],
        ['Generated By:', managerName],
        ['Generated On:', new Date().toLocaleString()],
        [],
        ['Filters'],
        ['Customer:', customerFilter],
        ['Category:', categoryFilter],
        ['Cashier:', cashierFilter],
        [],
        ['Metrics'],
        ['Total Transactions:', sales.length],
        ['Total Revenue:', sales.reduce((sum, s) => sum + s.total_amount, 0)],
        ['Total Items Sold:', sales.reduce((sum, s) => sum + s.saleItems.reduce((is, item) => is + item.quantity, 0), 0)],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');

    // --- DETAILED SALES SHEET ---
    const salesData = [
        ['Date', 'Time', 'Sale ID', 'Customer', 'Category', 'Cashier', 'Items Summary', 'Total Amount']
    ];

    sales.forEach(sale => {
        const date = new Date(sale.sale_date);
        salesData.push([
            date.toLocaleDateString(),
            date.toLocaleTimeString(),
            sale.id,
            sale.customer?.name || 'Walk-in',
            sale.sale_category,
            sale.createdBy?.name || sale.createdBy?.email || 'User',
            sale.saleItems.map(i => `${i.quantity}x ${i.item.name}`).join(', '),
            sale.total_amount
        ]);
    });

    const salesWs = XLSX.utils.aoa_to_sheet(salesData);
    salesWs['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 50 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, salesWs, 'Sales Data');

    // --- DETAILED ITEMS SHEET ---
    const itemsData = [
        ['Sale ID', 'Date', 'Item Name', 'Quantity', 'Unit Price', 'Total Price']
    ];

    sales.forEach(sale => {
        sale.saleItems.forEach(item => {
            itemsData.push([
                sale.id,
                new Date(sale.sale_date).toLocaleDateString(),
                item.item.name,
                item.quantity,
                item.unit_price,
                item.total_price
            ]);
        });
    });

    const itemsWs = XLSX.utils.aoa_to_sheet(itemsData);
    itemsWs['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, itemsWs, 'Sold Items');

    // Write File
    XLSX.writeFile(workbook, fileName);
};
