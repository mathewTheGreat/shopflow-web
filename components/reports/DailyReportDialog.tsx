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
import { dailyReportService, type DailyReportResponse } from "@/services/daily-report.service"
import { Loader2, FileSpreadsheet, FileText, Printer } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useItems } from "@/hooks/use-items"

interface DailyReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DailyReportDialog({ open, onOpenChange }: DailyReportDialogProps) {
  const userInfo = useAppStore((state) => state.userInfo)
  const activeShop = useAppStore((state) => state.activeShop)

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedShopId, setSelectedShopId] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: shops = [] } = useShops()
  const { items: allItems } = useItems()

  useEffect(() => {
    if (open && activeShop?.id) {
      setSelectedShopId(activeShop.id)
    }
  }, [open, activeShop])

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ["daily-report", selectedShopId, date],
    queryFn: () => {
      if (!selectedShopId || !date) return null
      return dailyReportService.generateDailyReport(selectedShopId, date)
    },
    enabled: !!selectedShopId && !!date && open,
  })

  const itemMap = allItems.reduce((acc, item) => {
    acc[item.id] = item
    return acc
  }, {} as Record<string, any>)

  const handleGenerateReport = async (action: 'preview' | 'excel' | 'pdf') => {
    if (!selectedShopId || !date) {
      toast.error("Please select a date and shop")
      return
    }

    setIsGenerating(true)
    try {
      const reportData = await dailyReportService.generateDailyReport(selectedShopId, date)
      const selectedShop = shops.find(s => s.id === selectedShopId)

      if (action === 'excel') {
        await exportDailyReportToExcel(
          reportData,
          selectedShop?.name || "Unknown Shop",
          userInfo?.name || "User",
          itemMap
        )
        toast.success("Excel report exported")
      } else {
        const html = formatDailyReportHTML(
          reportData,
          selectedShop?.name || "Unknown Shop",
          userInfo?.name || "User",
          itemMap
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
          <DialogTitle>Daily Report</DialogTitle>
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
            <Select value={selectedShopId} onValueChange={setSelectedShopId}>
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
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleGenerateReport('preview')}
            disabled={isGenerating || !selectedShopId || !date}
            className="w-full sm:w-auto bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
            Preview
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="default"
              onClick={() => handleGenerateReport('excel')}
              disabled={isGenerating || !selectedShopId || !date}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleGenerateReport('preview')}
              disabled={isGenerating || !selectedShopId || !date}
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

function formatCurrency(amount: number) {
  return `KES ${amount.toLocaleString()}`
}

function formatNumber(num: number) {
  return num.toLocaleString()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function formatDailyReportHTML(
  report: DailyReportResponse,
  shopName: string,
  userName: string,
  itemMap: Record<string, any>
) {
  const formatDateTime = (iso: string) => {
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

  const formatDateOnly = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: A4; margin: 0.5cm; }
        body { margin: 0; padding: 0.5cm; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; line-height: 1.2; color: #000; background: white; }
        .daily-report { width: 100%; max-width: 21cm; margin: 0 auto; box-sizing: border-box; }
        .report-header { text-align: center; border-bottom: 2px solid #2c5aa0; padding-bottom: 0.1cm; margin-bottom: 0.3cm; page-break-after: avoid; }
        .report-title { font-size: 18pt; font-weight: bold; color: #2c5aa0; margin: 0 0 0.05cm 0; text-transform: uppercase; }
        .report-date { font-size: 12pt; color: #666; margin: 0.1cm 0; }
        .report-meta { display: flex; justify-content: space-between; background: #f8f9fa; padding: 0.2cm; border-radius: 4px; border: 1px solid #eee; margin-bottom: 0.3cm; font-size: 9pt; }
        .section-title { font-size: 11pt; font-weight: bold; color: #2c5aa0; margin: 0.5cm 0 0.2cm 0; padding-bottom: 0.1cm; border-bottom: 1px solid #e0e0e0; page-break-after: avoid; }
        .item-section { background: white; border: 1px solid #ddd; border-radius: 4px; padding: 0.3cm; margin-bottom: 0.3cm; page-break-inside: avoid; }
        .item-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 0.2cm; margin-bottom: 0.2cm; }
        .item-name { font-size: 12pt; font-weight: bold; color: #2c5aa0; }
        .item-total { font-size: 10pt; font-weight: bold; color: #28a745; }
        .calculation-grid { font-size: 9pt; }
        .calc-item { display: flex; justify-content: space-between; padding: 0.1cm 0; border-bottom: 1px dashed #f0f0f0; }
        .calc-label { color: #666; }
        .calc-value { font-weight: 500; }
        .price-breakdown { background: #f8f9fa; border-radius: 3px; padding: 0.2cm; margin: 0.2cm 0; font-size: 8pt; }
        .price-item { display: flex; justify-content: space-between; padding: 0.1cm 0; border-bottom: 1px solid #eee; }
        .payment-section { background: #e3f2fd; border: 1px solid #2196f3; border-radius: 4px; padding: 0.3cm; margin: 0.3cm 0; page-break-inside: avoid; }
        .payment-title { font-size: 10pt; font-weight: bold; color: #1565c0; margin-bottom: 0.2cm; }
        .payment-item { display: flex; justify-content: space-between; padding: 0.1cm 0; border-bottom: 1px dashed #bbdefb; font-size: 9pt; }
        .payment-total { display: flex; justify-content: space-between; padding: 0.2cm 0; border-top: 1px solid #2196f3; margin-top: 0.1cm; font-weight: bold; font-size: 10pt; color: #0d47a1; }
        .advances-section { background: #fff8e6; border: 1px solid #ffd54f; border-radius: 3px; padding: 0.2cm; margin: 0.2cm 0; font-size: 9pt; }
        .advances-title { font-weight: bold; color: #e65100; margin-bottom: 0.1cm; }
        .advance-customer { display: flex; justify-content: space-between; padding: 0.05cm 0; border-bottom: 1px solid #ffecb3; }
        .expense-section { background: #ffebee; border: 1px solid #ef5350; border-radius: 4px; padding: 0.3cm; margin: 0.3cm 0; page-break-inside: avoid; }
        .expense-title { font-size: 10pt; font-weight: bold; color: #c62828; margin-bottom: 0.2cm; }
        .expense-item { display: flex; justify-content: space-between; padding: 0.1cm 0; border-bottom: 1px dashed #ffcdd2; font-size: 9pt; }
        .expense-total { display: flex; justify-content: space-between; padding: 0.2cm 0; border-top: 1px solid #ef5350; margin-top: 0.1cm; font-weight: bold; font-size: 10pt; color: #b71c1c; }
        .variance-section { background: #fce4ec; border: 1px solid #ec407a; border-radius: 4px; padding: 0.3cm; margin: 0.3cm 0; page-break-inside: avoid; }
        .variance-title { font-size: 10pt; font-weight: bold; color: #c2185b; margin-bottom: 0.2cm; }
        .variance-item { display: flex; justify-content: space-between; padding: 0.1cm 0; border-bottom: 1px dashed #f8bbd0; font-size: 9pt; }
        .footer { text-align: center; margin-top: 0.5cm; padding-top: 0.2cm; border-top: 1px solid #ddd; color: #666; font-style: italic; font-size: 8pt; page-break-before: avoid; }
        .no-data { text-align: center; color: #666; font-style: italic; padding: 0.3cm; background: #f8f9fa; border-radius: 4px; font-size: 9pt; }
        .production-card { background: #e8f5e8; border-left: 3px solid #4caf50; padding: 0.2cm; margin: 0.2cm 0; }
        .production-title { font-weight: bold; color: #2e7d32; font-size: 10pt; }
        .production-output { display: flex; justify-content: space-between; padding: 0.1cm 0; font-size: 9pt; }
        .production-loss { color: #c62828; font-size: 9pt; padding-top: 0.1cm; border-top: 1px dashed #a5d6a7; margin-top: 0.1cm; }
      </style>
    </head>
    <body>
      <div class="daily-report">
        <div class="report-header">
          <div class="report-title">Daily Report</div>
          <div class="report-date">${formatDateOnly(report.date)}</div>
        </div>
        
        <div class="report-meta">
          <span><strong>Shop:</strong> ${shopName}</span>
          <span><strong>Shifts:</strong> ${report.shifts.length > 0 ? report.shifts.map(s => s.name).join(', ') : 'None'}</span>
        </div>
  `

  // Stock Items with individual sections
  const regularStockItems = report.stockItems.filter(item => 
    itemMap[item.itemId]?.item_type !== "In-house"
  )
  const inHouseItems = report.stockItems.filter(item => 
    itemMap[item.itemId]?.item_type === "In-house"
  )

  if (regularStockItems.length > 0) {
    html += `<div class="section-title">STOCK ITEMS</div>`
    
    for (const item of regularStockItems) {
      const salesForItem = report.sales.find(s => s.itemId === item.itemId)
      
      html += `
        <div class="item-section">
          <div class="item-header">
            <span class="item-name">${item.itemName}</span>
            <span class="item-total">${formatNumber(item.balanceCf)} ${item.unitOfMeasure}</span>
          </div>
          <div class="calculation-grid">
            <div class="calc-item">
              <span class="calc-label">Balance b/f</span>
              <span class="calc-value">${formatNumber(item.balanceBf)} ${item.unitOfMeasure}</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">Received</span>
              <span class="calc-value">${formatNumber(item.received)} ${item.unitOfMeasure}</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">Total Available</span>
              <span class="calc-value">${formatNumber(item.balanceBf + item.received)} ${item.unitOfMeasure}</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">Sold</span>
              <span class="calc-value">${formatNumber(item.sold)} ${item.unitOfMeasure}</span>
            </div>
            ${item.productionOut > 0 ? `
            <div class="calc-item">
              <span class="calc-label">Production Out</span>
              <span class="calc-value">${formatNumber(item.productionOut)} ${item.unitOfMeasure}</span>
            </div>
            ` : ''}
            <div class="calc-item" style="border-top: 1px solid #ddd; padding-top: 0.15cm; margin-top: 0.1cm;">
              <span class="calc-label">Balance c/f</span>
              <span class="calc-value" style="font-weight: bold;">${formatNumber(item.balanceCf)} ${item.unitOfMeasure}</span>
            </div>
            ${item.totalVariance !== 0 || (item.varianceByShift && item.varianceByShift.length > 0) ? `
            <div class="calc-item" style="background: #fff3cd; padding: 0.15cm; margin-top: 0.1cm; border-radius: 3px;">
              <span class="calc-label" style="font-weight: bold; color: #856404;">Variance</span>
              <span class="calc-value" style="font-weight: bold; color: ${item.totalVariance < 0 ? '#c62828' : '#2e7d32'};">${item.totalVariance > 0 ? '+' : ''}${formatNumber(item.totalVariance)} ${item.unitOfMeasure}</span>
            </div>
            ${item.varianceByShift && item.varianceByShift.length > 0 ? `
            <div style="font-size: 8pt; margin-top: 0.1cm; padding-left: 0.2cm;">
              ${item.varianceByShift.map(v => `
                <div style="display: flex; justify-content: space-between; padding: 0.05cm 0; border-bottom: 1px dashed #eee;">
                  <span>${v.cashierName}</span>
                  <span style="color: ${v.variance < 0 ? '#c62828' : '#2e7d32'};">${v.variance > 0 ? '+' : ''}${formatNumber(v.variance)}</span>
                </div>
              `).join('')}
            </div>
            ` : ''}
            ` : ''}
          </div>
      `

      // Sales with price breakdown
      if (salesForItem && salesForItem.totalQuantity > 0) {
        html += `
          <div class="payment-section" style="margin-top: 0.2cm;">
            <div class="payment-title">SALES</div>
            <div class="calc-item">
              <span class="calc-label">Total Sold</span>
              <span class="calc-value">${formatNumber(salesForItem.totalQuantity)} ${item.unitOfMeasure}</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">Total Amount</span>
              <span class="calc-value" style="font-weight: bold;">${formatCurrency(salesForItem.totalAmount)}</span>
            </div>
        `
        
        if (salesForItem.prices.length > 0) {
          html += `<div class="price-breakdown">`
          for (const price of salesForItem.prices) {
            html += `
              <div class="price-item">
                <span>@ ${formatCurrency(price.price)}: ${formatNumber(price.quantity)} ${item.unitOfMeasure}</span>
                <span>${formatCurrency(price.total)}</span>
              </div>
            `
          }
          html += `</div>`
        }

        html += `</div>`
      }

      html += `</div>`
    }
  }

  // Production Section
  if (report.production.length > 0) {
    html += `<div class="section-title">PRODUCTION</div>`
    
    for (const batch of report.production) {
      html += `
        <div class="production-card">
          <div class="production-title">Input: ${batch.inputItem}</div>
          ${batch.outputItems.map(o => `
            <div class="production-output">
              <span>→ ${o.name}</span>
              <span>${formatNumber(o.quantity)}</span>
            </div>
          `).join('')}
          ${batch.loss > 0 ? `
            <div class="production-loss">
              Lost: ${formatNumber(batch.loss)}
            </div>
          ` : ''}
        </div>
      `
    }
  }

  // Payment Summary
  if (report.immediateSales.cash > 0 || report.immediateSales.mpesa > 0) {
    html += `
      <div class="section-title">IMMEDIATE SALES PAYMENTS</div>
      <div class="payment-section">
        <div class="payment-item">
          <span>Cash</span>
          <span>${formatCurrency(report.immediateSales.cash)}</span>
        </div>
        <div class="payment-item">
          <span>M-Pesa</span>
          <span>${formatCurrency(report.immediateSales.mpesa)}</span>
        </div>
        <div class="payment-total">
          <span>Total</span>
          <span>${formatCurrency(report.immediateSales.cash + report.immediateSales.mpesa)}</span>
        </div>
      </div>
    `
  }

  // Advances/Prepaid
  if (report.advances.length > 0) {
    html += `
      <div class="section-title">ADVANCES/PREPAID</div>
      <div class="advances-section">
        <div class="advances-title">Prepaid Sales</div>
    `
    for (const adv of report.advances) {
      html += `
        <div class="advance-customer">
          <span>${adv.customer} - ${adv.item}</span>
          <span>${formatNumber(adv.quantity)} (${formatCurrency(adv.amount)})</span>
        </div>
      `
    }
    html += `</div>`
  }

  // Credit Sales
  if (report.credit.length > 0) {
    html += `
      <div class="section-title">CREDIT SALES</div>
      <div class="advances-section" style="background: #fce4ec; border-color: #ec407a;">
        <div class="advances-title" style="color: #c2185b;">Credit Sales</div>
    `
    for (const cred of report.credit) {
      html += `
        <div class="advance-customer">
          <span>${cred.customer} - ${cred.item}</span>
          <span>${formatNumber(cred.quantity)} (${formatCurrency(cred.amount)})</span>
        </div>
      `
    }
    html += `</div>`
  }

  // Expenses
  if (report.expenses.length > 0) {
    const totalExpenses = report.expenses.reduce((sum, e) => sum + e.amount, 0)
    html += `
      <div class="section-title">EXPENSES</div>
      <div class="expense-section">
    `
    for (const exp of report.expenses) {
      html += `
        <div class="expense-item">
          <span style="text-transform: uppercase;">${exp.category}</span>
          <span>${formatCurrency(exp.amount)}</span>
        </div>
      `
    }
    html += `
        <div class="expense-total">
          <span>Total</span>
          <span>${formatCurrency(totalExpenses)}</span>
        </div>
      </div>
    `
  }

  // In-house items (Gas, Tokens, etc.)
  if (inHouseItems.length > 0) {
    html += `<div class="section-title">IN-HOUSE ITEMS</div>`
    
    for (const item of inHouseItems) {
      html += `
        <div class="item-section" style="border-left: 3px solid #6c757d;">
          <div class="item-header">
            <span class="item-name" style="color: #6c757d;">${item.itemName}</span>
            <span class="item-total" style="color: #6c757d;">${formatNumber(item.balanceCf)} ${item.unitOfMeasure}</span>
          </div>
          <div class="calculation-grid">
            <div class="calc-item">
              <span class="calc-label">Balance b/f</span>
              <span class="calc-value">${formatNumber(item.balanceBf)} ${item.unitOfMeasure}</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">Received</span>
              <span class="calc-value">${formatNumber(item.received)} ${item.unitOfMeasure}</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">Sold</span>
              <span class="calc-value">${formatNumber(item.sold)} ${item.unitOfMeasure}</span>
            </div>
            <div class="calc-item" style="border-top: 1px solid #ddd; padding-top: 0.15cm; margin-top: 0.1cm;">
              <span class="calc-label">Balance c/f</span>
              <span class="calc-value" style="font-weight: bold;">${formatNumber(item.balanceCf)} ${item.unitOfMeasure}</span>
            </div>
            ${item.totalVariance !== 0 || (item.varianceByShift && item.varianceByShift.length > 0) ? `
            <div class="calc-item" style="background: #fff3cd; padding: 0.15cm; margin-top: 0.1cm; border-radius: 3px;">
              <span class="calc-label" style="font-weight: bold; color: #856404;">Variance</span>
              <span class="calc-value" style="font-weight: bold; color: ${item.totalVariance < 0 ? '#c62828' : '#2e7d32'};">${item.totalVariance > 0 ? '+' : ''}${formatNumber(item.totalVariance)} ${item.unitOfMeasure}</span>
            </div>
            ${item.varianceByShift && item.varianceByShift.length > 0 ? `
            <div style="font-size: 8pt; margin-top: 0.1cm; padding-left: 0.2cm;">
              ${item.varianceByShift.map(v => `
                <div style="display: flex; justify-content: space-between; padding: 0.05cm 0; border-bottom: 1px dashed #eee;">
                  <span>${v.cashierName}</span>
                  <span style="color: ${v.variance < 0 ? '#c62828' : '#2e7d32'};">${v.variance > 0 ? '+' : ''}${formatNumber(v.variance)}</span>
                </div>
              `).join('')}
            </div>
            ` : ''}
            ` : ''}
          </div>
        </div>
      `
    }
  }

  // Remove the old staff variance section at bottom since it's now in each item
  // Staff Variance is now shown per item

  html += `
        <div class="footer">
          Report generated on ${formatDateTime(new Date().toISOString())} by ${userName}
        </div>
      </div>
    </body>
    </html>
  `

  return html
}

async function exportDailyReportToExcel(
  report: DailyReportResponse,
  shopName: string,
  userName: string,
  itemMap: Record<string, any>
) {
  const wb = XLSX.utils.book_new()
  const data: any[] = []

  // Header
  data.push(['DAILY REPORT', '', '', '', ''])
  data.push(['Shop:', shopName])
  data.push(['Date:', new Date(report.date).toLocaleDateString()])
  data.push(['Generated by:', userName])
  data.push([])

  // Stock Items
  data.push(['STOCK ITEMS'])
  data.push(['Item', 'B/f', 'Received', 'Sold', 'Prod Out', 'C/f'])
  for (const item of report.stockItems) {
    data.push([
      item.itemName,
      item.balanceBf,
      item.received,
      item.sold,
      item.productionOut,
      item.balanceCf
    ])
  }
  data.push([])

  // Production
  if (report.production.length > 0) {
    data.push(['PRODUCTION'])
    data.push(['Input', 'Output', 'Quantity', 'Loss'])
    for (const batch of report.production) {
      for (const output of batch.outputItems) {
        data.push([
          batch.inputItem,
          output.name,
          output.quantity,
          batch.loss
        ])
      }
    }
    data.push([])
  }

  // Sales
  data.push(['SALES'])
  data.push(['Item', 'Quantity', 'Amount'])
  for (const sale of report.sales) {
    data.push([sale.item, sale.totalQuantity, sale.totalAmount])
    if (sale.prices.length > 1) {
      for (const price of sale.prices) {
        data.push([`  @ ${price.price}`, price.quantity, price.total])
      }
    }
  }
  data.push([])

  // Payments
  data.push(['IMMEDIATE SALES'])
  data.push(['Cash', report.immediateSales.cash])
  data.push(['M-Pesa', report.immediateSales.mpesa])
  data.push(['Total', report.immediateSales.cash + report.immediateSales.mpesa])
  data.push([])

  // Advances
  if (report.advances.length > 0) {
    data.push(['ADVANCES/PREPAID'])
    data.push(['Customer', 'Item', 'Quantity', 'Amount'])
    for (const adv of report.advances) {
      data.push([adv.customer, adv.item, adv.quantity, adv.amount])
    }
    data.push([])
  }

  // Credit
  if (report.credit.length > 0) {
    data.push(['CREDIT SALES'])
    data.push(['Customer', 'Item', 'Quantity', 'Amount'])
    for (const cred of report.credit) {
      data.push([cred.customer, cred.item, cred.quantity, cred.amount])
    }
    data.push([])
  }

  // Expenses
  if (report.expenses.length > 0) {
    data.push(['EXPENSES'])
    data.push(['Category', 'Amount'])
    for (const exp of report.expenses) {
      data.push([exp.category, exp.amount])
    }
    data.push([])
  }

  const ws = XLSX.utils.aoa_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, "Daily Report")

  XLSX.writeFile(wb, `Daily_Report_${shopName}_${report.date}.xlsx`)
}
