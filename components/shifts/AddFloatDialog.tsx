"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Banknote, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react"
import { FloatSimulation, useSimulateFloatAllocation, useAllocateFloat } from "@/hooks/use-float"
import { Shift } from "@/types/shift"

interface AddFloatDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    activeShift: Shift | null
    shopId: string | undefined
    onSuccess?: () => void
}

export function AddFloatDialog({
    open,
    onOpenChange,
    activeShift,
    shopId,
    onSuccess,
}: AddFloatDialogProps) {
    const [amount, setAmount] = useState("")
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MPESA">("CASH")
    const [reason, setReason] = useState("")
    const [simulation, setSimulation] = useState<FloatSimulation | null>(null)

    const { mutateAsync: simulateFloat, isPending: isSimulating } = useSimulateFloatAllocation()
    const { mutateAsync: allocateFloat, isPending: isAllocating } = useAllocateFloat()

    const isLoading = isSimulating || isAllocating

    useEffect(() => {
        if (!open) {
            setAmount("")
            setPaymentMethod("CASH")
            setReason("")
            setSimulation(null)
        }
    }, [open])

    const handleSimulate = async () => {
        if (!activeShift || !amount || parseFloat(amount) <= 0) return

        try {
            const result = await simulateFloat({
                shiftId: activeShift.id,
                amount: parseFloat(amount),
            })
            setSimulation(result)
        } catch (error) {
            setSimulation(null)
        }
    }

    const handleAllocate = async () => {
        if (!activeShift || !amount || parseFloat(amount) <= 0) return

        try {
            await allocateFloat({
                targetShiftId: activeShift.id,
                amount: parseFloat(amount),
                paymentMethod,
                reason: reason || `Add float - ${paymentMethod}`,
            })
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            // Error is handled by the hook
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl">Add Float</DialogTitle>
                    <DialogDescription>
                        Add additional float to your current shift for large cash expenses.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {activeShift && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                Target Shift: <span className="font-medium text-foreground">
                                    {new Date(activeShift.start_time).toLocaleString()}
                                </span>
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="float-amount">Amount (KES)</Label>
                        <Input
                            id="float-amount"
                            type="number"
                            value={amount}
                            onChange={(e) => {
                                setAmount(e.target.value)
                                setSimulation(null)
                            }}
                            placeholder="Enter amount"
                            min="0"
                            step="100"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={paymentMethod === "CASH" ? "default" : "outline"}
                                className="flex-1"
                                onClick={() => setPaymentMethod("CASH")}
                            >
                                <Banknote className="h-4 w-4 mr-2" />
                                Cash
                            </Button>
                            <Button
                                type="button"
                                variant={paymentMethod === "MPESA" ? "default" : "outline"}
                                className="flex-1"
                                onClick={() => setPaymentMethod("MPESA")}
                            >
                                <CreditCard className="h-4 w-4 mr-2" />
                                M-Pesa
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="float-reason">Reason (Optional)</Label>
                        <Input
                            id="float-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Float for bulk purchase"
                        />
                    </div>

                    {amount && parseFloat(amount) > 0 && !simulation && (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleSimulate}
                            disabled={isSimulating}
                        >
                            {isSimulating ? "Simulating..." : "Check Availability"}
                        </Button>
                    )}

                    {simulation && (
                        <div className={`border rounded-lg p-4 space-y-3 ${
                            simulation.canFulfill
                                ? "border-green-500/50 bg-green-500/5"
                                : "border-red-500/50 bg-red-500/5"
                        }`}>
                            <div className="flex items-center gap-2">
                                {simulation.canFulfill ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                )}
                                <span className={`font-medium ${
                                    simulation.canFulfill ? "text-green-700" : "text-red-700"
                                }`}>
                                    {simulation.canFulfill ? "Can Fulfill" : "Insufficient Funds"}
                                </span>
                            </div>

                            <div className="text-sm space-y-1">
                                <p className="flex justify-between">
                                    <span className="text-muted-foreground">Requested:</span>
                                    <span className="font-medium">{formatCurrency(simulation.requestedAmount)}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-muted-foreground">Available:</span>
                                    <span className="font-medium">{formatCurrency(simulation.totalAvailable)}</span>
                                </p>
                            </div>

                            {simulation.availableSources.length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                    <p className="font-medium mb-1">Available Sources:</p>
                                    <div className="space-y-1">
                                        {simulation.availableSources.map((source, idx) => (
                                            <p key={idx} className="flex justify-between">
                                                <span>Shift {source.shift_id.slice(0, 8)}...</span>
                                                <span>{formatCurrency(source.available_cash)}</span>
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-end gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAllocate}
                        disabled={isLoading || !simulation?.canFulfill}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {isLoading ? "Allocating..." : "Allocate Float"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
