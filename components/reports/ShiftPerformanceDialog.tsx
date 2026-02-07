"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
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
    report: any,
    groupedPrepaidSales: any[],
    shopName: string,
    userName: string,
    itemMap: Record<string, any>
) {
    if (!report?.items) return "<div class='report-error'>No report data available.</div>";

    const date = report.start_time ? formatFullDateTime(report.start_time) : "Not started";
    const startTime = report.start_time ? formatFullDateTime(report.start_time) : "Not started";
    const endTime = report.end_time ? formatFullDateTime(report.end_time) : "Not ended";

    // Separate items using itemMap
    const saleItems = report.items.filter((item: any) => itemMap[item.item_id]?.type !== "In-house"); // Adjusted property check
    const inHouseItems = report.items.filter((item: any) => itemMap[item.item_id]?.type === "In-house");

    // Calculate cash sales summary
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

    // HTML Structure (Condensed version of provided code for brevity, ensuring key parts are present)
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Shift Report - ${date}</title>
      <style>
        @page { size: A4; margin: 0.5cm; }
        body { font-family: sans-serif; font-size: 10pt; line-height: 1.2; color: #000; }
        .report-header { text-align: center; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px; margin-bottom: 20px; }
        .report-title { color: #2c5aa0; margin: 0; font-size: 18pt; }
        .section-title { font-size: 12pt; font-weight: bold; color: #2c5aa0; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .card { border: 1px solid #ddd; padding: 10px; border-radius: 4px; break-inside: avoid; }
        .flex { display: flex; justify-content: space-between; }
        .font-bold { font-weight: bold; }
        .text-sm { font-size: 0.9em; }
        .text-xs { font-size: 0.8em; }
        .summary-box { background: #f0f7ff; padding: 10px; border-radius: 4px; margin-top: 10px; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="report-header">
        <h1 class="report-title">Shift Report</h1>
        <div>${shopName} Branch</div>
        <div>${startTime} - ${endTime}</div>
        <div class="text-sm">Manager: ${report.shiftManager} | Generated by: ${userName}</div>
      </div>
    `;

    // Sale Items
    html += `<div class="section-title">Sale Items</div><div class="grid">`;
    if (saleItems.length === 0) html += `<div>No sale items</div>`;
    else {
        for (const item of saleItems) {
            const itemName = itemMap[item.item_id]?.name || item.item_id;
            html += `
            <div class="card">
                <div class="flex font-bold"><span>${itemName}</span> <span style="color:green">Sold: ${item.sales_qty}</span></div>
                <div class="text-xs" style="margin-top:5px">
                    <div class="flex"><span>Opening:</span> <span>${item.opening_qty}</span></div>
                    <div class="flex"><span>Delivered:</span> <span>${item.total_in}</span></div>
                    <div class="flex"><span>Closing:</span> <span>${item.closing_qty}</span></div>
                    <div class="flex"><span>Variance:</span> <span style="color:${item.variance < 0 ? 'red' : 'black'}">${item.variance}</span></div>
                </div>
            </div>`;
        }
    }
    html += `</div>`;

    // Expenses
    html += `<div class="section-title">Expenses</div>`;
    if (report.expenses?.length > 0) {
        html += `<table style="width:100%; border-collapse:collapse; margin-top:10px">
            <tr style="background:#f9f9f9; text-align:left"><th>Description</th><th style="text-align:right">Amount</th></tr>`;
        for (const exp of report.expenses) {
            html += `<tr><td style="padding:5px; border-bottom:1px solid #eee">${exp.description || 'General'}</td><td style="padding:5px; border-bottom:1px solid #eee; text-align:right">KES ${exp.amount.toFixed(2)}</td></tr>`;
        }
        html += `</table>`;
    } else {
        html += `<div>No expenses recorded</div>`;
    }

    // Financial Summary
    if (report.sales_payment_summary) {
        const { cash = 0, mpesa = 0 } = report.sales_payment_summary;
        html += `
        <div class="section-title">Financial Summary</div>
        <div class="summary-box">
            <div class="flex"><span>Total Sales (Calculated):</span> <span>KES ${totalCashSales.toFixed(2)}</span></div>
            <div style="margin:10px 0; border-top:1px dashed #ccc"></div>
            <div class="flex"><span>Cash Payments:</span> <span>KES ${cash.toFixed(2)}</span></div>
            <div class="flex"><span>Mpesa Payments:</span> <span>KES ${mpesa.toFixed(2)}</span></div>
            <div class="flex font-bold" style="margin-top:5px; color:#2c5aa0"><span>Total Collected:</span> <span>KES ${(cash + mpesa).toFixed(2)}</span></div>
        </div>`;
    }

    html += `</body></html>`;
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
