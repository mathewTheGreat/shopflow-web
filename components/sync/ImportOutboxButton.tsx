"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, Download } from "lucide-react"
import { syncService } from "@/services/sync.service"
import { toast } from "sonner"
import * as XLSX from "xlsx"

export function ImportOutboxButton() {
    const [isImporting, setIsImporting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleButtonClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        const toastId = toast.loading("Parsing CSV and syncing to cloud...")

        try {
            const reader = new FileReader()
            reader.onload = async (e) => {
                try {
                    const data = e.target?.result as string
                    const workbook = XLSX.read(data, { type: "string" })
                    const sheetName = workbook.SheetNames[0]
                    const sheet = workbook.Sheets[sheetName]
                    const rows = XLSX.utils.sheet_to_json(sheet) as any[]

                    if (rows.length === 0) {
                        toast.error("CSV is empty", { id: toastId })
                        setIsImporting(false)
                        return
                    }

                    // Prepare payload by parsing the 'delta' JSON string
                    const payload = rows.map((row) => ({
                        id: row.id,
                        syncId: row.syncId,
                        entity_id: row.entity_id,
                        entity_name: row.entity_name,
                        operation: row.operation,
                        delta: row.delta, // Keep as string as expected by the mobile sync cloud API
                        local_version: parseInt(row.local_version),
                        created_at: row.created_at,
                    }))

                    // Pushing to cloud
                    const response = await syncService.sync(payload)

                    // Write response to file and trigger download
                    const logContent = JSON.stringify({
                        timestamp: new Date().toISOString(),
                        entriesProcessed: payload.length,
                        response: response
                    }, null, 2)

                    const blob = new Blob([logContent], { type: "application/json" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `sync_response_${new Date().getTime()}.json`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)

                    toast.success(`Successfully synced ${payload.length} entries. Response log downloaded.`, { id: toastId })
                } catch (err: any) {
                    console.error("Error during sync process:", err)
                    toast.error(`Sync failed: ${err.message}`, { id: toastId })
                } finally {
                    setIsImporting(false)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                }
            }
            reader.readAsText(file)
        } catch (err: any) {
            toast.error(`File read failed: ${err.message}`, { id: toastId })
            setIsImporting(false)
        }
    }

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
            />
            <Button
                variant="outline"
                onClick={handleButtonClick}
                disabled={isImporting}
                className="w-full justify-start gap-4 h-14 rounded-xl transition-all duration-200 hover:bg-muted"
            >
                {isImporting ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                    <Upload className="h-6 w-6 text-primary" />
                )}
                <span className="text-base font-semibold">
                    {isImporting ? "Syncing..." : "Import Outbox CSV"}
                </span>
            </Button>
        </>
    )
}
