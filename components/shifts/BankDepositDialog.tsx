"use client"

import { useEffect, useState } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Landmark, Loader2 } from "lucide-react"
import { usePostDeposit } from "@/hooks/use-cash-ledger"
import { RegisterAccountType } from "@/services/cash-ledger.service"

interface BankDepositDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shopId: string | undefined
    onSuccess?: () => void
}

const ACCOUNT_OPTIONS: Array<{ value: RegisterAccountType; label: string }> = [
    { value: "DRAWER", label: "Cash Drawer" },
    { value: "SAFE", label: "Safe" },
    { value: "BANK", label: "Bank Account" },
]

export function BankDepositDialog({ open, onOpenChange, shopId, onSuccess }: BankDepositDialogProps) {
    const [amount, setAmount] = useState("")
    const [fromAccount, setFromAccount] = useState<RegisterAccountType>("DRAWER")
    const [toAccount, setToAccount] = useState<RegisterAccountType>("BANK")
    const [reason, setReason] = useState("")

    const { mutateAsync: postDeposit, isPending } = usePostDeposit()

    useEffect(() => {
        if (!open) {
            setAmount("")
            setFromAccount("DRAWER")
            setToAccount("BANK")
            setReason("")
        }
    }, [open])

    const parsed = parseFloat(amount)
    const valid = !!shopId && Number.isFinite(parsed) && parsed > 0 && fromAccount !== toAccount

    const handleSubmit = async () => {
        if (!valid || !shopId) return
        try {
            await postDeposit({
                shopId,
                amount: parsed,
                fromAccount,
                toAccount,
                reason: reason.trim() || undefined,
            })
            onOpenChange(false)
            onSuccess?.()
        } catch {
            // toast handled in the mutation
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Landmark className="h-5 w-5" />
                        Bank Deposit
                    </DialogTitle>
                    <DialogDescription>
                        Move cash between registers as one balanced transfer. A bank fee, if any,
                        is recorded separately as an expense.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="deposit-amount">Amount (KES)</Label>
                        <Input
                            id="deposit-amount"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>From</Label>
                            <Select value={fromAccount} onValueChange={(v) => setFromAccount(v as RegisterAccountType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ACCOUNT_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>To</Label>
                            <Select value={toAccount} onValueChange={(v) => setToAccount(v as RegisterAccountType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ACCOUNT_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {fromAccount === toAccount && (
                        <p className="text-sm text-destructive">Source and destination must differ.</p>
                    )}
                    <div className="space-y-1">
                        <Label htmlFor="deposit-reason">Reference (optional)</Label>
                        <Input
                            id="deposit-reason"
                            placeholder="Deposit slip / reference"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!valid || isPending}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Record Deposit"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
