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
import { useShops } from "@/hooks/use-shops"
import { useAppStore } from "@/store/use-app-store"
import { shiftService } from "@/services/shift.service"
import { Loader2, FileSpreadsheet, FileText, Printer } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useItems } from "@/hooks/use-items"

// Helper to format date for display
const formatFullDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    })
}

interface ShiftPerformanceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ShiftPerformanceDialog({ open, onOpenChange }: ShiftPerformanceDialogProps) {
    const userInfo = useAppStore((state) => state.userInfo)
    const activeShop = useAppStore((state) => state.activeShop)

    // State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedShopId, setSelectedShopId] = useState<string>("")
    const [selectedShiftId, setSelectedShiftId] = useState<string>("")
    const [isGenerating, setIsGenerating] = useState(false)

    // Data Hooks
    const { data: shops = [] } = useShops()
    const { items: allItems } = useItems() // For item mapping

    // Initialize shop selection
    useEffect(() => {
        if (open && activeShop?.id) {
            // If user is cashier (based on logic in prompt: "cashiers will have the preassigned shop which cannot be changed")
            // Ideally check role, but for now defaulting to activeShop
            setSelectedShopId(activeShop.id)
        }
    }, [open, activeShop])

    // Fetch Shifts based on Date & Shop
    const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
        queryKey: ["shifts", selectedShopId, date],
        queryFn: () => {
            if (!selectedShopId || !date) return []
            return shiftService.getShiftsByShopAndDate(selectedShopId, date)
        },
        enabled: !!selectedShopId && !!date && open,
    })

    // Create Item Map for Report
    const itemMap = allItems.reduce((acc, item) => {
        acc[item.id] = item
        return acc
    }, {} as Record<string, any>)

    const handleGenerateReport = async (action: 'preview' | 'excel' | 'pdf') => {
        if (!selectedShiftId) {
            toast.error("Please select a shift")
            return
        }

        setIsGenerating(true)
        try {
            const reportData = await shiftService.getShiftPerformanceReport(selectedShiftId)
            const selectedShop = shops.find(s => s.id === selectedShopId)
            const selectedShift = shifts.find(s => s.id === selectedShiftId)

            if (action === 'excel') {
                await exportShiftReportToExcel(
                    reportData,
                    [], // groupedPrepaidSales - Assuming empty for now or fetched if API provided it
                    selectedShop?.name || "Unknown Shop",
                    userInfo?.name || "User",
                    itemMap
                )
                toast.success("Excel report exported")
            } else {
                // Preview or PDF (Print)
                const html = formatShiftReportHTML(
                    reportData,
                    [], // groupedPrepaidSales
                    selectedShop?.name || "Unknown Shop",
                    userInfo?.name || "User",
                    itemMap
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
                    <DialogTitle>Shift Performance</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Shop</Label>
                        <Select
                            value={selectedShopId}
                            onValueChange={setSelectedShopId}
                        // Disable if user is not manager (Logic placeholder: assumes all can change for now unless stricter check added)
                        // disabled={userRole !== 'manager'} 
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
                        <Label>Shift</Label>
                        <Select value={selectedShiftId} onValueChange={setSelectedShiftId}>
                            <SelectTrigger>
                                <SelectValue placeholder={shiftsLoading ? "Loading shifts..." : "Select shift"} />
                            </SelectTrigger>
                            <SelectContent>
                                {shifts.map((shift) => (
                                    <SelectItem key={shift.id} value={shift.id}>
                                        {/* Use manager email/name as requested in prompt */}
                                        {/* "use the manager name for the display value of the shift select" */}
                                        {/* API response example shows 'manager_name': "vickymduya@gmail.com" */}
                                        {shift.manager_name || `Shift ${new Date(shift.start_time).toLocaleTimeString()}`}
                                        <span className="text-xs text-muted-foreground ml-2">
                                            ({new Date(shift.start_time).toLocaleTimeString()})
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {shifts.length === 0 && !shiftsLoading && (
                            <p className="text-xs text-muted-foreground">No shifts found for this date.</p>
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
                            onClick={() => handleGenerateReport('preview')} // PDF acts same as preview, user prints to PDF
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

// --- REPORT GENERATION HELPERS (Adapted for Web) ---

function formatShiftReportHTML(
    report: {
        shiftId?: string;
        shiftManager?: string;
        shopId?: string;
        start_time?: string;
        end_time?: string;
        previous_shift?: { id: string; start_time: string; end_time: string } | null;
        items?: Array<{
            item_id: string;
            opening_qty: number | null;
            opening_source: "stock_take" | "none";
            closing_qty: number | null;
            closing_ts: string | null;
            total_in: number;
            total_out: number;
            prepaid_qty: number;
            sales_qty: number;
            effective_out: number;
            expected_closing: number | null;
            variance: number | null;
            derived_opening_balance: null;
        }>;
        expenses?: Array<{ description?: string; amount: number }>;
        sales_payment_summary?: {
            cash: number;
            mpesa: number;
            all_methods: { CASH: number; MPESA: number };
        };
        financials_breakdown?: Record<string, any>;
    },
    groupedPrepaidSales: { item_id: string; customers: Array<{ customer_name?: string; quantity: number }> }[],
    shopName: string,
    userName: string,
    itemMap: Record<string, { name?: string; item_type?: string; sale_price?: number }>
) {
    if (!report?.items) return "<div class='report-error'>No report data available.</div>";

    const formatDateTime = (iso: string | undefined) => {
        if (!iso) return "N/A"
        return new Date(iso).toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        })
    }
    const startTimeFriendly = formatDateTime(report.start_time);
    const endTimeFriendly = formatDateTime(report.end_time);

    const saleItems = report.items.filter((item) => itemMap[item.item_id]?.item_type !== "In-house");
    const inHouseItems = report.items.filter((item) => itemMap[item.item_id]?.item_type === "In-house");

    const cashSalesSummary: { [itemName: string]: number } = {};
    let totalCashSales = 0;

    for (const item of saleItems) {
        const itemName = itemMap[item.item_id]?.name || item.item_id;
        const regularSalesQty = item.sales_qty - (item.prepaid_qty ?? 0);
        const itemPrice = itemMap[item.item_id]?.sale_price || 0;
        const cashSaleAmount = regularSalesQty * itemPrice;

        cashSalesSummary[itemName] = cashSaleAmount;
        totalCashSales += cashSaleAmount;
    }

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: A4; margin: 0.5cm; }
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; line-height: 1.2; color: #000; background: white; }
        .shift-report { width: 100%; max-width: 21cm; margin: 0 auto; padding: 0.5cm; box-sizing: border-box; }
        .report-header { text-align: center; border-bottom: 1px solid #2c5aa0; padding-bottom: 0.3cm; margin-bottom: 0.5cm; page-break-after: avoid; }
        .report-title { font-size: 14pt; font-weight: bold; color: #2c5aa0; margin: 0 0 0.2cm 0; }
        .report-subtitle { font-size: 9pt; color: #666; margin: 0.1cm 0; }
        .report-meta { display: flex; justify-content: space-between; background: #f8f9fa; padding: 0.3cm; border-radius: 3px; margin: 0.3cm 0; font-size: 8pt; page-break-after: avoid; }
        .section-title { font-size: 11pt; font-weight: bold; color: #2c5aa0; margin: 0.4cm 0 0.2cm 0; padding-bottom: 0.2cm; border-bottom: 1px solid #e0e0e0; page-break-after: avoid; }
        .in-house-section { margin-top: 0.4cm; padding-top: 0.3cm; border-top: 1px solid #6c757d; page-break-inside: avoid; }
        .in-house-title { font-size: 11pt; font-weight: bold; color: #6c757d; margin-bottom: 0.3cm; }
        .item-card { background: white; border: 1px solid #ddd; border-radius: 4px; padding: 0.3cm; margin-bottom: 0.3cm; page-break-inside: avoid; }
        .in-house-card { background: #f8f9fa; border-left: 3px solid #6c757d; padding: 0.2cm; }
        .item-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 0.2cm; margin-bottom: 0.2cm; }
        .item-id { font-size: 10pt; font-weight: bold; color: #2c5aa0; }
        .in-house-id { color: #6c757d; font-size: 9pt; }
        .item-total { font-size: 9pt; font-weight: bold; color: #28a745; }
        .in-house-total { color: #6c757d; font-size: 8pt; }
        .calculation-grid { font-size: 8pt; }
        .calc-item { display: flex; justify-content: space-between; padding: 0.1cm 0; border-bottom: 1px dashed #f0f0f0; }
        .calc-label { color: #666; }
        .calc-value { font-weight: 500; }
        .advance-section { background: #fff8e6; border: 1px solid #ffd54f; border-radius: 3px; padding: 0.2cm; margin: 0.2cm 0; font-size: 8pt; }
        .advance-title { font-weight: bold; color: #e65100; margin-bottom: 0.1cm; font-size: 8pt; }
        .advance-customer { display: flex; justify-content: space-between; padding: 0.05cm 0; border-bottom: 1px solid #ffecb3; }
        .summary-section { background: #e8f5e8; border: 1px solid #4caf50; border-radius: 4px; padding: 0.3cm; margin: 0.4cm 0; page-break-inside: avoid; }
        .summary-title { font-size: 10pt; font-weight: bold; color: #2e7d32; margin-bottom: 0.2cm; }
        .payment-summary { background: #e3f2fd; border: 1px solid #2196f3; border-radius: 4px; padding: 0.3cm; margin: 0.3cm 0; page-break-inside: avoid; }
        .payment-summary-title { font-size: 10pt; font-weight: bold; color: #1565c0; margin-bottom: 0.2cm; }
        .payment-item { display: flex; justify-content: space-between; padding: 0.1cm 0; border-bottom: 1px dashed #bbdefb; font-size: 8pt; }
        .payment-total { display: flex; justify-content: space-between; padding: 0.2cm 0; border-top: 1px solid #2196f3; margin-top: 0.1cm; font-weight: bold; font-size: 9pt; color: #0d47a1; }
        .payment-split { background: #f0f7ff; border-radius: 3px; padding: 0.2cm; margin-top: 0.2cm; border-left: 3px solid #2196f3; }
        .split-item { display: flex; justify-content: space-between; padding: 0.05cm 0; font-size: 8pt; }
        .footer { text-align: center; margin-top: 0.5cm; padding-top: 0.3cm; border-top: 1px solid #ddd; color: #666; font-style: italic; font-size: 8pt; page-break-before: avoid; }
        .highlight { background: #fff3cd; padding: 0.2cm; border-radius: 3px; border-left: 3px solid #ffc107; margin: 0.2cm 0; font-size: 8pt; }
        .no-items { text-align: center; color: #666; font-style: italic; padding: 0.3cm; background: #f8f9fa; border-radius: 4px; font-size: 9pt; }
        @media print { body { font-size: 9pt; } .shift-report { padding: 0; margin: 0; } .item-card { page-break-inside: avoid; break-inside: avoid; } .section-title { page-break-after: avoid; break-after: avoid; } .report-header { page-break-after: avoid; break-after: avoid; } }
        .compact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.2cm; }
        @media (max-width: 15cm) { .compact-grid { grid-template-columns: 1fr; } }
      </style>
    </head>
    <body>
      <div class="shift-report">
        <div class="report-header">
          <h1 class="report-title">Shift Report</h1>
          <div class="report-subtitle">${shopName} Branch</div>
          ${startTimeFriendly && endTimeFriendly ? `<div class="report-subtitle">${startTimeFriendly} — ${endTimeFriendly}</div>` : ''}
        </div>

        <div class="report-meta">
          <div><strong>Generated:</strong> ${formatDateTime(new Date().toISOString())}</div>
          <div><strong>Shift Manager:</strong> ${report.shiftManager || userName}</div>
        </div>
  `;

    html += `<div class="section-title">Sale Items</div>`;

    if (saleItems.length === 0) {
        html += `<div class="no-items">No sale items for this shift</div>`;
    } else {
        const useCompactGrid = saleItems.length > 4;
        if (useCompactGrid) html += `<div class="compact-grid">`;

        for (const item of saleItems) {
            const itemName = itemMap[item.item_id]?.name || item.item_id;
            const total = (item.opening_qty ?? 0) + (item.total_in ?? 0);
            const prepaid = groupedPrepaidSales.find(p => p.item_id === item.item_id);
            const prepaidTotal = prepaid?.customers.reduce((a, c) => a + c.quantity, 0) ?? 0;
            const totalSold = item.sales_qty + prepaidTotal;

            html += `
          <div class="item-card" style="${useCompactGrid ? 'margin-bottom: 0.2cm; padding: 0.2cm;' : ''}">
            <div class="item-header">
              <div class="item-id" style="${useCompactGrid ? 'font-size: 9pt;' : ''}">${itemName}</div>
              <div class="item-total" style="${useCompactGrid ? 'font-size: 8pt;' : ''}">Sold: ${totalSold}</div>
            </div>
            
            <div class="calculation-grid">
              <div class="calc-item">
                <span class="calc-label">Opening Balance:</span>
                <span class="calc-value">${item.opening_qty ?? 0}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">Delivered:</span>
                <span class="calc-value">${item.total_in ?? 0}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">Total Available:</span>
                <span class="calc-value">${total}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">Total Out:</span>
                <span class="calc-value">${item.total_out ?? 0}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">Sales:</span>
                <span class="calc-value">${item.sales_qty ?? 0}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">Prepaid:</span>
                <span class="calc-value">${item.prepaid_qty ?? 0}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">Effective Out:</span>
                <span class="calc-value">${item.effective_out ?? 0}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">Expected Closing:</span>
                <span class="calc-value">${item.expected_closing ?? 0}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">Balance:</span>
                <span class="calc-value">${item.closing_qty ?? 0}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">Variance:</span>
                <span class="calc-value">${item.variance ?? 0}</span>
              </div>
            </div>
      `;

            if (prepaid && prepaid.customers.length > 0) {
                html += `
            <div class="advance-section" style="${useCompactGrid ? 'padding: 0.1cm; font-size: 7pt;' : ''}">
              <div class="advance-title">Advance Sales</div>
        `;
                for (const c of prepaid.customers) {
                    html += `
              <div class="advance-customer">
                <span>${c.customer_name ?? "Unknown Customer"}</span>
                <span><strong>${c.quantity}</strong></span>
              </div>
          `;
                }
                html += `
              <div class="advance-customer" style="border-top: 1px solid #ffd54f; margin-top: 0.1cm; padding-top: 0.1cm;">
                <span><strong>Total Advance:</strong></span>
                <span><strong>${prepaidTotal}</strong></span>
              </div>
            </div>
        `;
            }

            html += `</div>`;
        }

        if (useCompactGrid) html += `</div>`;
    }

    html += `<div class="in-house-section">
            <div class="in-house-title">In-House Items</div>`;

    if (inHouseItems.length === 0) {
        html += `<div class="no-items">No in-house items for this shift</div>`;
    } else {
        const useCompactGrid = inHouseItems.length > 3;
        if (useCompactGrid) html += `<div class="compact-grid">`;

        for (const item of inHouseItems) {
            const itemName = itemMap[item.item_id]?.name || item.item_id;
            html += `
          <div class="item-card in-house-card" style="${useCompactGrid ? 'margin-bottom: 0.2cm; padding: 0.2cm;' : ''}">
            <div class="item-header">
              <div class="item-id in-house-id" style="${useCompactGrid ? 'font-size: 8pt;' : ''}">${itemName}</div>
              <div class="item-total in-house-total" style="${useCompactGrid ? 'font-size: 7pt;' : ''}">In-House</div>
            </div>
            
            <div class="calculation-grid">
              <div class="calc-item">
                <span class="calc-label">Delivered:</span>
                <span class="calc-value">${item.total_in ?? 0}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">Balance:</span>
                <span class="calc-value">${item.closing_qty ?? 0}</span>
              </div>
            </div>
          </div>
      `;
        }

        if (useCompactGrid) html += `</div>`;
    }

    html += `</div>`;

    if ((report.expenses?.length ?? 0) > 0) {
        const totalExpenses = report.expenses!.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        html += `
      <div class="section-title">Expenses</div>
      <div class="item-card" style="background:#fff8f8;border-left:3px solid #dc3545;padding:0.2cm;">
        ${report.expenses!.map((exp) => `
            <div class="calc-item">
              <span class="calc-label">${exp.description || "General"}</span>
              <span class="calc-value">KSh ${(exp.amount || 0).toFixed(2)}</span>
            </div>
        `).join("")}
        <div class="calc-item" style="border-top:1px solid #eee;font-weight:bold;padding-top:0.1cm;">
          <span>Total Expenses</span>
          <span>KSh ${totalExpenses.toFixed(2)}</span>
        </div>
      </div>
    `;
    } else {
        html += `
      <div class="section-title">Expenses</div>
      <div class="no-items">No expenses recorded for this shift</div>
    `;
    }

    html += `
    <div class="payment-summary">
      <div class="payment-summary-title">Sales Payment Summary</div>
  `;

    if (Object.keys(cashSalesSummary).length === 0) {
        html += `<div class="no-items" style="background: #bbdefb; padding: 0.2cm;">No sales for this shift</div>`;
    } else {
        for (const [itemName, amount] of Object.entries(cashSalesSummary)) {
            html += `
        <div class="payment-item">
          <span>${itemName}:</span>
          <span>KSh ${amount.toFixed(2)}</span>
        </div>
      `;
        }

        html += `
      <div class="payment-total">
        <span>Total Sales:</span>
        <span>KSh ${totalCashSales.toFixed(2)}</span>
      </div>
    `;

        if (report.sales_payment_summary) {
            const { cash = 0, mpesa = 0 } = report.sales_payment_summary;
            const totalFromSplit = cash + mpesa;

            html += `
        <div class="payment-split">
          <div style="font-weight: bold; margin-bottom: 0.1cm; font-size: 8pt;">Payment Method Split:</div>
          <div class="split-item">
            <span>Cash:</span>
            <span>KSh ${cash.toFixed(2)}</span>
          </div>
          <div class="split-item">
            <span>Mpesa:</span>
            <span>KSh ${mpesa.toFixed(2)}</span>
          </div>
          <div class="split-item" style="border-top: 1px dashed #bbdefb; padding-top: 0.1cm; font-weight: bold;">
            <span>Total from Split:</span>
            <span>KSh ${totalFromSplit.toFixed(2)}</span>
          </div>
        `;

            if (Math.abs(totalCashSales - totalFromSplit) > 0.01) {
                html += `
          <div class="split-item" style="color: #e65100; font-style: italic; margin-top: 0.1cm;">
            <span>Note: Difference of KSh ${Math.abs(totalCashSales - totalFromSplit).toFixed(2)}</span>
          </div>
        `;
            }

            html += `</div>`;
        }
    }

    html += `</div>`;


    html += `
        <div class="footer">
          Report generated on ${formatDateTime(new Date().toISOString())} by ${userName}
        </div>
      </div>
    </body>
    </html>
  `;

    return html;
}


async function exportShiftReportToExcel(
    report: any,
    groupedPrepaidSales: any[],
    shopName: string,
    userName: string,
    itemMap: Record<string, any>
) {
    if (!report?.items) throw new Error('No report data');

    const wb = XLSX.utils.book_new();
    const data: any[] = [];

    // Header
    data.push(['SHIFT REPORT', '', '', '', '']);
    data.push(['Shop:', shopName]);
    data.push(['Period:', `${new Date(report.start_time).toLocaleString()} - ${new Date(report.end_time).toLocaleString()}`]);
    data.push([]);

    // Items
    data.push(['ITEM PERFORMANCE']);
    data.push(['Item Name', 'Opening', 'In', 'Sales', 'Closing', 'Variance']);

    report.items.forEach((item: any) => {
        const itemName = itemMap[item.item_id]?.name || item.item_id;
        data.push([
            itemName,
            item.opening_qty,
            item.total_in,
            item.sales_qty,
            item.closing_qty,
            item.variance
        ]);
    });
    data.push([]);

    // Expenses
    data.push(['EXPENSES']);
    data.push(['Description', 'Amount']);
    report.expenses?.forEach((exp: any) => {
        data.push([exp.description, exp.amount]);
    });
    data.push([]);

    // Summary
    data.push(['SUMMARY']);
    if (report.sales_payment_summary) {
        data.push(['Cash Payments', report.sales_payment_summary.cash]);
        data.push(['Mpesa Payments', report.sales_payment_summary.mpesa]);
        data.push(['Total', (report.sales_payment_summary.cash || 0) + (report.sales_payment_summary.mpesa || 0)]);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Shift Report");

    // Browser Download
    XLSX.writeFile(wb, `Shift_Report_${shopName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
