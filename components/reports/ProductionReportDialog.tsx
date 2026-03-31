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
import { useAppStore } from "@/store/use-app-store"
import { productionService } from "@/services/production.service"
import { Loader2, FileSpreadsheet, FileText, Printer, Factory } from "lucide-react"
import { toast } from "sonner"
import { ProductionReportData, ProductionBatchStatus, ProductionProcessType } from "@/types/production"

interface ProductionReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductionReportDialog({ open, onOpenChange }: ProductionReportDialogProps) {
  const userInfo = useAppStore((state) => state.userInfo)
  const activeShop = useAppStore((state) => state.activeShop)

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedProcessType, setSelectedProcessType] = useState<string>("all")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateReport = async (action: 'preview' | 'excel' | 'pdf') => {
    if (!activeShop?.id) {
      toast.error("No shop selected")
      return
    }

    setIsGenerating(true)
    try {
      const params: any = {
        start_date: startDate,
        end_date: endDate
      }
      
      if (selectedStatus !== "all") params.status = selectedStatus
      if (selectedProcessType !== "all") params.process_type = selectedProcessType

      const reportData = await productionService.getProductionReport(activeShop.id, params)

      const dateRangeLabel = `${startDate} to ${endDate}`

      if (action === 'excel') {
        await exportProductionReportToExcelWeb(
          reportData,
          activeShop?.name || "Unknown Shop",
          userInfo?.name || "User",
          dateRangeLabel,
          `Production_Report_${startDate}_${endDate}.xlsx`
        )
        toast.success("Excel report exported")
      } else {
        const html = formatProductionReportHTML(
          reportData,
          activeShop?.name || "Unknown Shop",
          userInfo?.name || "User",
          dateRangeLabel,
          selectedStatus,
          selectedProcessType
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
          <DialogTitle>Production Report</DialogTitle>
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
            <Label>Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="FINALIZED">Finalized</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Process Type</Label>
            <Select value={selectedProcessType} onValueChange={setSelectedProcessType}>
              <SelectTrigger>
                <SelectValue placeholder="All Process Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Process Types</SelectItem>
                <SelectItem value="PASTEURIZATION">Pasteurization</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
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
            Preview PDF
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
        <div className="text-xs text-muted-foreground text-center mt-2 px-4">
          Select a date range and filters to generate production reports.
        </div>
      </DialogContent>
    </Dialog>
  )
}

function formatProductionReportHTML(
  reportData: ProductionReportData,
  shopName: string,
  userName: string,
  reportDate: string,
  statusFilter: string,
  processTypeFilter: string
) {
  const { batches, summary } = reportData

  const statusLabel = statusFilter === "all" ? "All" : statusFilter
  const processLabel = processTypeFilter === "all" ? "All" : processTypeFilter
  const efficiency = summary.totalInputQuantity > 0 
    ? ((summary.totalOutputQuantity / summary.totalInputQuantity) * 100).toFixed(1)
    : "0.0"

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: A4; margin: 0.5cm; }
        body { margin: 0; padding: 0.5cm; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; line-height: 1.2; color: #000; background: white; }
        .production-report { width: 100%; max-width: 21cm; margin: 0 auto; box-sizing: border-box; }
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
        .batches-table { width: 100%; border-collapse: collapse; margin: 0.3cm 0; font-size: 8pt; page-break-inside: auto; }
        .batches-table th { background: #2c5aa0; color: white; padding: 0.2cm; text-align: left; font-weight: bold; }
        .batches-table td { padding: 0.15cm; border-bottom: 1px solid #eee; }
        .batches-table tr:nth-child(even) { background: #f8f9fa; }
        .batch-details { background: #fafafa; border: 1px solid #e0e0e0; border-radius: 4px; padding: 0.2cm; margin: 0.1cm 0; page-break-inside: avoid; }
        .batch-details-title { font-weight: bold; font-size: 9pt; color: #2c5aa0; margin-bottom: 0.1cm; }
        .item-list { font-size: 8pt; margin: 0; padding-left: 0.3cm; }
        .item-list li { margin: 0.05cm 0; }
        .status-draft { background: #fff3cd; color: #856404; padding: 0.1cm 0.2cm; border-radius: 2px; font-weight: bold; }
        .status-finalized { background: #d4edda; color: #155724; padding: 0.1cm 0.2cm; border-radius: 2px; font-weight: bold; }
        .status-cancelled { background: #f8d7da; color: #721c24; padding: 0.1cm 0.2cm; border-radius: 2px; font-weight: bold; }
        .footer { text-align: center; margin-top: 0.5cm; padding-top: 0.2cm; border-top: 1px solid #ddd; color: #666; font-style: italic; font-size: 7.5pt; page-break-before: avoid; }
        @media print { body { font-size: 9pt; } .production-report { padding: 0; margin: 0; } .summary-grid { page-break-inside: avoid; break-inside: avoid; } .batches-table { page-break-inside: auto; } .section-title { page-break-after: avoid; break-after: avoid; } .report-header { page-break-after: avoid; break-after: avoid; } }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="production-report">
        <div class="report-header">
          <h1 class="report-title">Production Report</h1>
          <div class="report-subtitle">${shopName} Branch</div>
          <div class="report-subtitle">${reportDate}</div>
        </div>
        <div class="report-meta">
          <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          <div><strong>Generated By:</strong> ${userName}</div>
          <div><strong>Status Filter:</strong> ${statusLabel}</div>
          <div><strong>Process Type:</strong> ${processLabel}</div>
        </div>

        <div class="section-title">Executive Summary</div>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-value">${summary.totalBatches}</div>
            <div class="summary-label">Total Batches</div>
          </div>
          <div class="summary-card">
            <div class="summary-value positive">${summary.finalizedBatches}</div>
            <div class="summary-label">Finalized</div>
          </div>
          <div class="summary-card">
            <div class="summary-value neutral">${summary.draftBatches}</div>
            <div class="summary-label">Draft</div>
          </div>
          <div class="summary-card">
            <div class="summary-value negative">${summary.cancelledBatches}</div>
            <div class="summary-label">Cancelled</div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-value">${summary.totalInputQuantity}</div>
            <div class="summary-label">Total Input</div>
          </div>
          <div class="summary-card">
            <div class="summary-value positive">${summary.totalOutputQuantity}</div>
            <div class="summary-label">Total Output</div>
          </div>
          <div class="summary-card">
            <div class="summary-value negative">${summary.totalLossQuantity}</div>
            <div class="summary-label">Total Loss</div>
          </div>
          <div class="summary-card">
            <div class="summary-value ${parseFloat(efficiency) >= 80 ? 'positive' : parseFloat(efficiency) >= 60 ? 'neutral' : 'negative'}">${efficiency}%</div>
            <div class="summary-label">Efficiency</div>
          </div>
        </div>

        <div class="section-title">Batch Details</div>
        ${batches.length === 0 
          ? '<div>No production batches found for the selected filters</div>'
          : batches.map(batch => {
              const batchEfficiency = batch.total_input_quantity 
                ? ((batch.total_output_quantity || 0) / batch.total_input_quantity * 100).toFixed(1)
                : '0.0';
              const statusClass = batch.status === 'FINALIZED' ? 'status-finalized' : batch.status === 'DRAFT' ? 'status-draft' : 'status-cancelled';
              
              const inputItems = batch.inputs?.map((inp: any) => `${inp.item_name || inp.item_id}: ${inp.quantity}`).join(', ') || 'None'
              const outputItems = batch.outputs?.map((out: any) => `${out.item_name || out.item_id}: ${out.quantity}`).join(', ') || 'None'

              return `
                <div class="batch-details">
                  <table class="batches-table" style="margin-bottom: 0.1cm;">
                    <tr>
                      <th style="background: #5a7bc0;">Date & Time</th>
                      <th style="background: #5a7bc0;">Process Type</th>
                      <th style="background: #5a7bc0;">Status</th>
                      <th style="background: #5a7bc0;" class="text-right">Input</th>
                      <th style="background: #5a7bc0;" class="text-right">Output</th>
                      <th style="background: #5a7bc0;" class="text-right">Loss</th>
                      <th style="background: #5a7bc0;" class="text-right">Efficiency</th>
                    </tr>
                    <tr>
                      <td>${formatDateTime(batch.created_at)}</td>
                      <td>${batch.process_type}</td>
                      <td><span class="${statusClass}">${batch.status}</span></td>
                      <td class="text-right">${batch.total_input_quantity || 0}</td>
                      <td class="text-right">${batch.total_output_quantity || 0}</td>
                      <td class="text-right ${batch.total_loss_quantity > 0 ? 'negative' : ''}">${batch.total_loss_quantity || 0}</td>
                      <td class="text-right">${batchEfficiency}%</td>
                    </tr>
                  </table>
                  <div class="batch-details-title">Input Items:</div>
                  <ul class="item-list">${batch.inputs?.length > 0 ? batch.inputs.map((inp: any) => `<li>${inp.item_name || inp.item_id} - ${inp.quantity}</li>`).join('') : '<li>None</li>'}</ul>
                  <div class="batch-details-title">Output Items:</div>
                  <ul class="item-list">${batch.outputs?.length > 0 ? batch.outputs.map((out: any) => `<li>${out.item_name || out.item_id} - ${out.quantity}</li>`).join('') : '<li>None</li>'}</ul>
                  ${batch.notes ? `<div class="batch-details-title">Notes: ${batch.notes}</div>` : ''}
                </div>
              `
            }).join('')
        }

        <div class="footer">
          Production Report generated on ${new Date().toLocaleString()} by ${userName}
        </div>
      </div>
    </body>
    </html>
  `
}

const exportProductionReportToExcelWeb = async (
  reportData: ProductionReportData,
  shopName: string,
  userName: string,
  reportDate: string,
  fileName: string
): Promise<void> => {
  const { batches, summary } = reportData
  const efficiency = summary.totalInputQuantity > 0 
    ? ((summary.totalOutputQuantity / summary.totalInputQuantity) * 100).toFixed(1)
    : "0.0"

  const workbook = XLSX.utils.book_new()

  const data: any[] = []

  data.push(['PRODUCTION REPORT'])
  data.push([])
  data.push(['Report Information'])
  data.push(['Shop:', shopName])
  data.push(['Date:', reportDate])
  data.push(['Generated by:', userName])
  data.push(['Generated on:', new Date().toLocaleString()])
  data.push([])

  data.push(['EXECUTIVE SUMMARY'])
  data.push([])
  data.push(['Metric', 'Value'])
  data.push(['Total Batches', summary.totalBatches])
  data.push(['Finalized Batches', summary.finalizedBatches])
  data.push(['Draft Batches', summary.draftBatches])
  data.push(['Cancelled Batches', summary.cancelledBatches])
  data.push(['Total Input Quantity', summary.totalInputQuantity])
  data.push(['Total Output Quantity', summary.totalOutputQuantity])
  data.push(['Total Loss Quantity', summary.totalLossQuantity])
  data.push(['Average Efficiency', `${efficiency}%`])
  data.push([])

  data.push(['BATCH DETAILS'])
  data.push([])
  data.push([
    'Date',
    'Process Type',
    'Status',
    'Input Qty',
    'Output Qty',
    'Loss Qty',
    'Efficiency %',
    'Notes'
  ])

  batches.forEach(batch => {
    const batchEfficiency = batch.total_input_quantity 
      ? ((batch.total_output_quantity || 0) / batch.total_input_quantity * 100).toFixed(1)
      : '0.0'
    const batchDate = batch.created_at ? new Date(batch.created_at).toLocaleString() : 'N/A'
    
    data.push([
      batchDate,
      batch.process_type,
      batch.status,
      batch.total_input_quantity || 0,
      batch.total_output_quantity || 0,
      batch.total_loss_quantity || 0,
      `${batchEfficiency}%`,
      batch.notes || ''
    ])
  })

  data.push([])

  data.push(['INPUT DETAILS'])
  data.push([])
  data.push(['Batch Date', 'Item Name', 'Input Quantity'])

  batches.forEach(batch => {
    if (batch.inputs && batch.inputs.length > 0) {
      batch.inputs.forEach((input: any) => {
        const batchDate = batch.created_at ? new Date(batch.created_at).toLocaleDateString() : 'N/A'
        data.push([
          batchDate,
          input.item_name || input.item_id,
          input.quantity
        ])
      })
    }
  })

  data.push([])

  data.push(['OUTPUT DETAILS'])
  data.push([])
  data.push(['Batch Date', 'Item Name', 'Output Quantity'])

  batches.forEach(batch => {
    if (batch.outputs && batch.outputs.length > 0) {
      batch.outputs.forEach((output: any) => {
        const batchDate = batch.created_at ? new Date(batch.created_at).toLocaleDateString() : 'N/A'
        data.push([
          batchDate,
          output.item_name || output.item_id,
          output.quantity
        ])
      })
    }
  })

  const worksheet = XLSX.utils.aoa_to_sheet(data)

  const colWidths = [
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 25 }
  ]
  worksheet['!cols'] = colWidths

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Production Report')
  XLSX.writeFile(workbook, fileName)
}
