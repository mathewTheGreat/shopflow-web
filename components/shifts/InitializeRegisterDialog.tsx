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
import { AlertCircle, Landmark, Loader2, PiggyBank, Wallet } from "lucide-react"
import { useInitializeRegister, useRegisterInitialization } from "@/hooks/use-cash-ledger"
import { RegisterAccountType } from "@/services/cash-ledger.service"
import { cn } from "@/lib/utils"

interface InitializeRegisterDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shopId: string | undefined
    onSuccess?: () => void
}

const ACCOUNT_ORDER: RegisterAccountType[] = ["DRAWER", "MPESA", "BANK", "SAFE"]

const ACCOUNT_META: Record<RegisterAccountType, { label: string; icon: typeof Wallet }> = {
    DRAWER: { label: "Cash Drawer", icon: Wallet },
    MPESA: { label: "M-Pesa", icon: Wallet },
    BANK: { label: "Bank", icon: Landmark },
    SAFE: { label: "Safe", icon: PiggyBank },
}

const emptyBalances = (): Record<RegisterAccountType, string> => ({
    DRAWER: "",
    MPESA: "",
    BANK: "",
    SAFE: "",
})

const money = (value: number) => value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

export function InitializeRegisterDialog({
    open,
    onOpenChange,
    shopId,
    onSuccess,
}: InitializeRegisterDialogProps) {
    const { accounts, initialized, initialization, isLoading } = useRegisterInitialization(open ? shopId : undefined)
    const { mutateAsync, isPending } = useInitializeRegister()
    const [balances, setBalances] = useState<Record<RegisterAccountType, string>>(emptyBalances)
    const [note, setNote] = useState("")
    const [prefilled, setPrefilled] = useState(false)

    const currentByType = new Map(accounts.map((account) => [account.account_type, account]))
    const currency = accounts[0]?.currency || "KES"

    useEffect(() => {
        if (!open) {
            setPrefilled(false)
            setBalances(emptyBalances())
            setNote("")
        }
    }, [open])

    // Start from what the ledger currently says so the manager sees the
    // derived balance and only overrides what is actually on hand. The server
    // then posts the difference, so the saved balances are exactly the entered
    // amounts rather than a fresh set of legs on top of the old ones.
    useEffect(() => {
        if (!open || prefilled || isLoading) return
        if (accounts.length === 0) return
        const next = emptyBalances()
        for (const account of accounts) {
            next[account.account_type] = String(Math.max(0, account.balance))
        }
        setBalances(next)
        setPrefilled(true)
    }, [open, prefilled, isLoading, accounts])

    const parsed = ACCOUNT_ORDER.map((type) => ({
        type,
        current: currentByType.get(type)?.balance ?? 0,
        value: Number(balances[type]),
    }))
    const allValid = parsed.every(({ value }) => Number.isFinite(value) && value >= 0)
    const changed = parsed.some(({ current, value }) => Math.abs(value - current) > 0.004)
    const canSubmit = !!shopId && allValid && (changed || !initialized) && !isLoading

    const handleSubmit = async () => {
        if (!canSubmit || !shopId) return
        try {
            await mutateAsync({
                shopId,
                balances: {
                    DRAWER: Number(balances.DRAWER),
                    MPESA: Number(balances.MPESA),
                    BANK: Number(balances.BANK),
                    SAFE: Number(balances.SAFE),
                },
                note: note.trim() || undefined,
            })
            onOpenChange(false)
            onSuccess?.()
        } catch {
            // toast handled by the mutation
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        {initialized ? "Correct Register Balances" : "Initialize Register"}
                    </DialogTitle>
                    <DialogDescription>
                        Enter what is actually on hand for each account. The difference from the
                        current derived balance is posted as one opening adjustment, so the register
                        ends exactly on the amounts below.
                    </DialogDescription>
                </DialogHeader>

                {initialization?.activeShiftId && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>
                            A shift is open. Saving sets the register baseline only; the open shift's
                            expected cash is not changed.
                        </span>
                    </div>
                )}

                {initialized && initialization?.initializedAt && (
                    <p className="text-xs text-muted-foreground">
                        Last initialized {new Date(initialization.initializedAt).toLocaleString()}.
                    </p>
                )}

                <div className="space-y-3">
                    {ACCOUNT_ORDER.map((type) => {
                        const { label, icon: Icon } = ACCOUNT_META[type]
                        const current = currentByType.get(type)?.balance ?? 0
                        const value = Number(balances[type])
                        const hasValue = balances[type] !== "" && Number.isFinite(value)
                        const delta = hasValue ? value - current : 0
                        return (
                            <div key={type} className="rounded-lg border p-3 space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{label}</p>
                                            <p className="text-xs text-muted-foreground tabular-nums">
                                                Derived: {currency} {money(current)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative w-40 shrink-0">
                                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            KES
                                        </span>
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={balances[type]}
                                            onChange={(e) => setBalances((prev) => ({ ...prev, [type]: e.target.value }))}
                                            className="h-11 pl-11 text-right text-lg font-bold tabular-nums"
                                        />
                                    </div>
                                </div>
                                {hasValue && Math.abs(delta) > 0.004 && (
                                    <p className={cn(
                                        "text-xs tabular-nums text-right",
                                        delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                                    )}>
                                        Adjustment {delta > 0 ? "+" : "-"}{currency} {money(Math.abs(delta))}
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="init-note">Note (optional)</Label>
                    <Input
                        id="init-note"
                        placeholder="e.g. Opening balances at go-live"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="h-11"
                    />
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : initialized ? "Save Balances" : "Initialize Register"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
