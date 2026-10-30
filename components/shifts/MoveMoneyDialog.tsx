"use client"

import { useEffect, useRef, useState } from "react"
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
import { AlertCircle, ArrowRightLeft, Loader2 } from "lucide-react"
import { usePostDeposit, useRegisterAccounts } from "@/hooks/use-cash-ledger"
import { useAppStore } from "@/store/use-app-store"
import { RegisterAccountType } from "@/services/cash-ledger.service"
import { v4 as uuidv4 } from "uuid"

interface MoveMoneyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shopId: string | undefined
    onSuccess?: () => void
}

const ACCOUNT_OPTIONS: Array<{ value: RegisterAccountType; label: string }> = [
    { value: "DRAWER", label: "Cash Drawer" },
    { value: "MPESA", label: "M-Pesa" },
    { value: "SAFE", label: "Safe" },
    { value: "BANK", label: "Bank Account" },
]

const money = (value: number) => value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

export function MoveMoneyDialog({ open, onOpenChange, shopId, onSuccess }: MoveMoneyDialogProps) {
    const activeShift = useAppStore((state) => state.activeShift)
    const { accounts = [] } = useRegisterAccounts(open ? shopId : undefined)
    const [amount, setAmount] = useState("")
    const [fromAccount, setFromAccount] = useState<RegisterAccountType>("DRAWER")
    const [toAccount, setToAccount] = useState<RegisterAccountType>("BANK")
    const [reason, setReason] = useState("")
    const retryKey = useRef<{ signature: string; key: string } | null>(null)

    const { mutateAsync: postDeposit, isPending } = usePostDeposit()

    useEffect(() => {
        if (!open) {
            setAmount("")
            setFromAccount("DRAWER")
            setToAccount("BANK")
            setReason("")
            retryKey.current = null
        }
    }, [open])

    const parsed = parseFloat(amount)
    const valid = !!shopId && !!activeShift && Number.isFinite(parsed) && parsed > 0 && fromAccount !== toAccount
    const sourceBalance = accounts.find((a) => a.account_type === fromAccount)?.balance
    const overBalance = sourceBalance !== undefined && Number.isFinite(parsed) && parsed > sourceBalance

    const handleSubmit = async () => {
        if (!valid || !shopId) return
        const signature = JSON.stringify({
            shopId,
            amount: parsed,
            fromAccount,
            toAccount,
            reason: reason.trim(),
        })
        const idempotencyKey = retryKey.current?.signature === signature
            ? retryKey.current.key
            : uuidv4()
        retryKey.current = { signature, key: idempotencyKey }
        try {
            await postDeposit({
                shopId,
                amount: parsed,
                fromAccount,
                toAccount,
                reason: reason.trim() || undefined,
                idempotencyKey,
            })
            retryKey.current = null
            onOpenChange(false)
            onSuccess?.()
        } catch {
            // toast handled in the mutation
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5" />
                        Move Money
                    </DialogTitle>
                    <DialogDescription>
                        Move money between accounts as one balanced transfer. A bank fee, if any,
                        is recorded separately as an expense.
                    </DialogDescription>
                </DialogHeader>

                {!activeShift && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>Open a shift before moving money.</span>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="move-amount">Amount (KES)</Label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                KES
                            </span>
                            <Input
                                id="move-amount"
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="h-16 pl-16 pr-4 text-2xl font-black tabular-nums"
                            />
                        </div>
                        {overBalance && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                This is more than the {fromAccount} balance ({money(sourceBalance || 0)}).
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>From</Label>
                            <Select value={fromAccount} onValueChange={(v) => setFromAccount(v as RegisterAccountType)}>
                                <SelectTrigger className="h-11">
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
                            {sourceBalance !== undefined && (
                                <p className="text-xs text-muted-foreground tabular-nums">
                                    Available: KES {money(sourceBalance)}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label>To</Label>
                            <Select value={toAccount} onValueChange={(v) => setToAccount(v as RegisterAccountType)}>
                                <SelectTrigger className="h-11">
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

                    <div className="space-y-1.5">
                        <Label htmlFor="move-reason">Reference (optional)</Label>
                        <Input
                            id="move-reason"
                            placeholder="Deposit slip / reference"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="h-11"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!valid || isPending}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Record Move"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
