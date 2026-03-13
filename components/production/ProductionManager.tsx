"use client"

import { useState } from "react"
import { Factory, Plus, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductionBatchesGrid } from "./ProductionBatchesGrid"
import { OpenProductionDialog } from "./OpenProductionDialog"
import { CloseProductionDialog } from "./CloseProductionDialog"
import { ProductionBatchDetails } from "./ProductionBatchDetails"
import { ProductionBatch } from "@/types/production"
import { useAppStore } from "@/store/use-app-store"

type View = "list" | "details"

interface ProductionManagerProps {
    onBack: () => void
}

export function ProductionManager({ onBack }: ProductionManagerProps) {
    const [currentView, setCurrentView] = useState<View>("list")
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
    const [showOpenDialog, setShowOpenDialog] = useState(false)
    const [showCloseDialog, setShowCloseDialog] = useState(false)
    const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null)

    const activeShift = useAppStore((state) => state.activeShift)

    const handleBatchClick = (batch: ProductionBatch) => {
        setSelectedBatchId(batch.id)
        setCurrentView("details")
    }

    const handleBack = () => {
        setCurrentView("list")
        setSelectedBatchId(null)
    }

    const handleCloseBatch = (batch: ProductionBatch) => {
        setSelectedBatch(batch)
        setShowCloseDialog(true)
    }

    const handleCloseDialogSuccess = () => {
        setShowCloseDialog(false)
        setSelectedBatch(null)
        if (selectedBatchId) {
            setCurrentView("list")
            setSelectedBatchId(null)
        }
    }

    return (
        <div className="flex flex-col h-full bg-muted/30">
            {/* Header */}
            <div className="bg-card border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-10 h-16">
                <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold tracking-tight">Production</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage pasteurization and production batches
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Full-width CTA */}
                    <Button 
                        onClick={() => setShowOpenDialog(true)} 
                        disabled={!activeShift}
                        className="w-full bg-primary hover:bg-primary/90 h-14 text-base shadow-lg"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Open New Batch
                    </Button>

                    {!activeShift && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                            You need an open shift to start production. Please open a shift first.
                        </div>
                    )}

                    {currentView === "list" && (
                        <ProductionBatchesGrid onBatchClick={handleBatchClick} />
                    )}

                    {currentView === "details" && selectedBatchId && (
                        <ProductionBatchDetails
                            batchId={selectedBatchId}
                            onBack={handleBack}
                            onCloseBatch={handleCloseBatch}
                        />
                    )}
                </div>
            </div>

            <OpenProductionDialog
                open={showOpenDialog}
                onOpenChange={setShowOpenDialog}
                onSuccess={() => {}}
            />

            <CloseProductionDialog
                open={showCloseDialog}
                onOpenChange={setShowCloseDialog}
                batch={selectedBatch}
                onSuccess={handleCloseDialogSuccess}
            />
        </div>
    )
}
