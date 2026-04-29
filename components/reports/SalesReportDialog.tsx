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
import { shiftService } from "@/services/shift.service"
import { useCustomersByShop } from "@/hooks/use-customers"
import { useItems } from "@/hooks/use-items"
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
    const [selectedItemId, setSelectedItemId] = useState<string>("all")
    const [selectedShiftId, setSelectedShiftId] = useState<string>("all")
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
    const { items } = useItems()

    const { data: staff = [], isLoading: isLoadingStaff } = useQuery({
        queryKey: ["shop-staff", selectedShopId, "CASHIER"],
        queryFn: () => userService.getUsersByRole("2fb92608-7257-485d-9c58-14ed6586d6b9", selectedShopId),
        enabled: !!selectedShopId && open,
    })

    const { data: shifts = [], isLoading: isLoadingShifts } = useQuery({
        queryKey: ["shifts", selectedShopId, startDate, endDate, selectedCashierId],
        queryFn: () => shiftService.getShiftsByShopAndDate(selectedShopId, startDate, endDate, selectedCashierId === "all" ? undefined : selectedCashierId),
        enabled: !!selectedShopId && !!startDate && open,
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
                saleCategory: selectedSaleCategory,
                itemId: selectedItemId,
                shiftId: selectedShiftId === "all" ? undefined : selectedShiftId
            })

            const shopName = shops.find(s => s.id === selectedShopId)?.name || activeShop?.name || "Unknown Shop"
            const customerName = selectedCustomerId === "all" ? "All Customers" : customers.find(c => c.id === selectedCustomerId)?.name || "Unknown"
            const selectedStaff = staff.find(s => s.id === selectedCashierId)
            const cashierName = selectedCashierId === "all"
                ? "All Cashiers"
                : (selectedStaff?.name || selectedStaff?.email || (selectedCashierId === userInfo?.id ? (userInfo?.name || userInfo?.email) : null) || "User")
            const categoryName = selectedSaleCategory === "all" ? "All Categories" : selectedSaleCategory
            const itemName = selectedItemId === "all" ? "All Items" : items.find(i => i.id === selectedItemId)?.name || "Unknown Item"
            const selectedShift = shifts.find(s => s.id === selectedShiftId)
            const shiftName = selectedShiftId === "all" ? "All Shifts" : (selectedShift?.name || `Shift ${selectedShiftId.slice(0, 8)}`)

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
                    itemName,
                    shiftName,
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
                    cashierName,
                    itemName,
                    shiftName
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
                                onChange={(e) => {
                                    setStartDate(e.target.value)
                                    setSelectedShiftId("all")
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>To</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value)
                                    setSelectedShiftId("all")
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Shop</Label>
                        <Select
                            value={selectedShopId}
                            onValueChange={(value) => {
                                setSelectedShopId(value)
                                setSelectedShiftId("all")
                            }}
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
                            onValueChange={(value) => {
                                setSelectedCashierId(value)
                                setSelectedShiftId("all")
                            }}
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
                        <Label>Shift</Label>
                        <Select
                            value={selectedShiftId}
                            onValueChange={setSelectedShiftId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingShifts ? "Loading..." : "Select shift"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Shifts</SelectItem>
                                {shifts.length === 0 && !isLoadingShifts ? (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No shifts found for selected filters</div>
                                ) : (
                                    shifts.map((shift) => (
                                        <SelectItem key={shift.id} value={shift.id}>
                                            {shift.name} ({new Date(shift.start_time).toLocaleDateString()})
                                        </SelectItem>
                                    ))
                                )}
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

                    <div className="space-y-2">
                        <Label>Item</Label>
                        <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Items</SelectItem>
                                {items.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                        {item.name}
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


// --- REPORT LOGIC ---

function formatSalesReportHTML(
    sales: SaleReport[],
    shopName: string,
    managerName: string,
    startDate: string,
    endDate: string,
    customerFilter: string,
    categoryFilter: string,
    cashierFilter: string,
    itemFilter: string,
    shiftFilter: string
) {
    const isItemFiltered = itemFilter !== "All Items";

    const getFilteredTotal = (sale: SaleReport) => {
        if (isItemFiltered) {
            return sale.saleItems.reduce((sum, item) => sum + item.total_price, 0);
        }
        return sale.total_amount;
    };

    const totalAmount = sales.reduce((sum, sale) => sum + getFilteredTotal(sale), 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.saleItems.reduce((is, item) => is + item.quantity, 0), 0);

    const paymentTotals: Record<string, number> = {};
    sales.forEach(sale => {
        const ratio = isItemFiltered ? (sale.total_amount > 0 ? getFilteredTotal(sale) / sale.total_amount : 0) : 1;
        sale.salePayments.forEach(payment => {
            const method = payment.payment_method;
            paymentTotals[method] = (paymentTotals[method] || 0) + payment.amount * ratio;
        });
    });

    // Separate totals for cash, Mpesa, and other methods
    const cashTotal = paymentTotals['CASH'] || 0;
    const mpesaTotal = paymentTotals['MPESA'] || 0;
    const otherTotal = Object.entries(paymentTotals)
        .filter(([method]) => method !== 'CASH' && method !== 'MPESA')
        .reduce((sum, [, amount]) => sum + amount, 0);

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true,
            timeZone: 'UTC'
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
          margin: 0; padding: 0.5cm; font-size: 10pt; line-height: 1.2; color: #000; background: white;
        }
        .report-container { width: 100%; max-width: 21cm; margin: 0 auto; box-sizing: border-box; }
        .report-header { text-align: center; border-bottom: 2px solid #2c5aa0; padding-bottom: 0.1cm; margin-bottom: 0.3cm; page-break-after: avoid; }
        .report-title { font-size: 16pt; font-weight: bold; color: #2c5aa0; margin: 0 0 0.05cm 0; }
        .report-subtitle { font-size: 10pt; color: #666; margin: 0.02cm 0; }
        .report-meta { display: flex; justify-content: space-between; background: #f8f9fa; padding: 0.2cm; border-radius: 4px; border: 1px solid #eee; margin-bottom: 0.3cm; font-size: 8pt; flex-wrap: wrap; gap: 10px; }
        .summary { margin-bottom: 0.3cm; background: #e8f5e8; padding: 0.3cm; border-radius: 4px; border: 1px solid #4caf50; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.2cm; font-size: 9pt; }
        .summary-item { text-align: center; padding: 0.2cm; background: white; border-radius: 3px; border: 1px solid #ddd; }
        .summary-value { font-size: 11pt; font-weight: bold; color: #2c5aa0; margin: 0.1cm 0; }
        .summary-label { font-size: 8pt; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 0.3cm; font-size: 8pt; }
        th { background-color: #2c5aa0; color: white; padding: 0.2cm; text-align: left; font-weight: bold; }
        td { padding: 0.2cm; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background-color: #f8f9fa; }
        .text-right { text-align: right; }
        .badge { padding: 2px 6px; border-radius: 4px; font-size: 7pt; font-weight: bold; }
        .badge-IMMEDIATE { background: #e3f2fd; color: #0d47a1; }
        .badge-CREDIT { background: #ffebee; color: #c62828; }
        .badge-PREPAID { background: #e8f5e9; color: #1b5e20; }
        .footer { text-align: center; margin-top: 0.4cm; padding-top: 0.2cm; border-top: 1px solid #ddd; color: #666; font-style: italic; font-size: 7.5pt; }
        .items-list { font-size: 7.5pt; color: #555; margin-top: 2px; }
        .grand-total-row { background: #e3f2fd; font-weight: bold; border-top: 2px solid #2196f3; border-bottom: 2px solid #2196f3; }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
            <h1 class="report-title">Sales Report</h1>
            <div class="report-subtitle">${shopName} Branch</div>
            <div class="report-subtitle">${startDate} — ${endDate}</div>
        </div>
        
        <div class="report-meta">
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
            <div><strong>Generated By:</strong> ${managerName}</div>
            <div><strong>Cashier:</strong> ${cashierFilter}</div>
            <div><strong>Customer:</strong> ${customerFilter}</div>
            <div><strong>Category:</strong> ${categoryFilter}</div>
            <div><strong>Item:</strong> ${itemFilter}</div>
            <div><strong>Shift:</strong> ${shiftFilter}</div>
        </div>

        <!-- Top summary: transaction count, items, total revenue only -->
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
                <div class="summary-value"> ${totalAmount.toLocaleString()}</div>
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
              <th class="text-right">Cash</th>
              <th class="text-right">Mpesa</th>
              <th class="text-right">Other</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sales.length > 0 ? sales.map(sale => {
        const saleTotal = getFilteredTotal(sale);
        const ratio = isItemFiltered ? (sale.total_amount > 0 ? saleTotal / sale.total_amount : 0) : 1;

        const cashAmount = sale.salePayments
            .filter(p => p.payment_method === 'CASH')
            .reduce((sum, p) => sum + p.amount * ratio, 0);
        const mpesaAmount = sale.salePayments
            .filter(p => p.payment_method === 'MPESA')
            .reduce((sum, p) => sum + p.amount * ratio, 0);
        const otherAmount = sale.salePayments
            .filter(p => p.payment_method !== 'CASH' && p.payment_method !== 'MPESA')
            .reduce((sum, p) => sum + p.amount * ratio, 0);

        return `
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
                <td class="text-right">${cashAmount ? cashAmount.toLocaleString() : '-'}</td>
                <td class="text-right">${mpesaAmount ? mpesaAmount.toLocaleString() : '-'}</td>
                <td class="text-right">${otherAmount ? otherAmount.toLocaleString() : '-'}</td>
                <td class="text-right font-bold">${saleTotal.toLocaleString()}</td>
              </tr>
            `}).join('') : '<tr><td colspan="9" style="text-align:center; padding: 20px;">No sales found for the selected period.</td></tr>'}
          </tbody>
          <tfoot>
            <tr class="grand-total-row">
                <td colspan="5"><strong>GRAND TOTAL</strong></td>
                <td class="text-right"><strong> ${cashTotal.toLocaleString()}</strong></td>
                <td class="text-right"><strong> ${mpesaTotal.toLocaleString()}</strong></td>
                <td class="text-right"><strong> ${otherTotal.toLocaleString()}</strong></td>
                <td class="text-right"><strong> ${totalAmount.toLocaleString()}</strong></td>
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
    itemFilter: string,
    shiftFilter: string,
    fileName: string
): Promise<void> => {
    const workbook = XLSX.utils.book_new();

    const isItemFiltered = itemFilter !== "All Items";

    const getFilteredTotal = (sale: SaleReport) => {
        if (isItemFiltered) {
            return sale.saleItems.reduce((sum, item) => sum + item.total_price, 0);
        }
        return sale.total_amount;
    };

    const paymentTotals: Record<string, number> = {};
    sales.forEach(sale => {
        const ratio = isItemFiltered ? (sale.total_amount > 0 ? getFilteredTotal(sale) / sale.total_amount : 0) : 1;
        sale.salePayments.forEach(payment => {
            const method = payment.payment_method;
            paymentTotals[method] = (paymentTotals[method] || 0) + payment.amount * ratio;
        });
    });

    // --- SUMMARY SHEET ---
    const summaryData: any[][] = [
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
        ['Item:', itemFilter],
        ['Shift:', shiftFilter],
        [],
        ['Metrics'],
        ['Total Transactions:', sales.length],
        ['Total Revenue:', sales.reduce((sum, s) => sum + getFilteredTotal(s), 0)],
        ...Object.entries(paymentTotals).map(([method, amount]) => [`${method} Total:`, amount]),
        ['Total Items Sold:', sales.reduce((sum, s) => sum + s.saleItems.reduce((is, item) => is + item.quantity, 0), 0)],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');

    // --- DETAILED SALES SHEET ---
    const salesData: any[][] = [
        ['Date', 'Time', 'Sale ID', 'Customer', 'Category', 'Cashier', 'Items Summary', 'Payment Methods', 'Total Amount']
    ];

    sales.forEach(sale => {
        const date = new Date(sale.sale_date);
        const saleTotal = getFilteredTotal(sale);
        const paymentMethods = sale.salePayments.length > 0
            ? sale.salePayments.map(p => p.payment_method).join(', ')
            : (sale.sale_category === 'CREDIT' ? 'Account Credit' : (sale.sale_category === 'PREPAID' ? 'Account Prepaid' : '-'));

        salesData.push([
            date.toLocaleDateString('en-US', { timeZone: 'UTC' }),
            date.toLocaleTimeString('en-US', { timeZone: 'UTC' }),
            sale.id,
            sale.customer?.name || 'Walk-in',
            sale.sale_category,
            sale.createdBy?.name || sale.createdBy?.email || 'User',
            sale.saleItems.map(i => `${i.quantity}x ${i.item.name}`).join(', '),
            sale.salePayments.length > 0
                ? sale.salePayments.map(p => {
                    const ratio = isItemFiltered ? (sale.total_amount > 0 ? saleTotal / sale.total_amount : 0) : 1;
                    return `${p.payment_method} (${(p.amount * ratio).toFixed(2)})`;
                }).join(', ')
                : (sale.sale_category === 'CREDIT' ? 'Account Credit' : (sale.sale_category === 'PREPAID' ? 'Account Prepaid' : '-')),
            saleTotal
        ]);
    });

    const salesWs = XLSX.utils.aoa_to_sheet(salesData);
    salesWs['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 50 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, salesWs, 'Sales Data');

    // --- DETAILED ITEMS SHEET ---
    const itemsData: any[][] = [
        ['Sale ID', 'Date', 'Item Name', 'Quantity', 'Unit Price', 'Total Price']
    ];

    sales.forEach(sale => {
        sale.saleItems.forEach(item => {
            itemsData.push([
                sale.id,
                new Date(sale.sale_date).toLocaleDateString('en-US', { timeZone: 'UTC' }),
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
