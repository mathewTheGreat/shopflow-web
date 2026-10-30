"use client"

import { useEffect, useState } from "react"
import {
    ChevronLeft,
    AlertCircle,
    ArrowRightLeft,
    Loader2,
    Settings2,
    Wallet,
    PiggyBank,
    Landmark,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ListPagination } from "@/components/ui/list-pagination"
import { useRegisterAccounts, useLedgerStatement, useRegisterInitialization } from "@/hooks/use-cash-ledger"
import { useAppStore } from "@/store/use-app-store"
import { MoveMoneyDialog } from "./MoveMoneyDialog"
import { InitializeRegisterDialog } from "./InitializeRegisterDialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface CashRegisterManagerProps {
    onBack?: () => void
}

const accountIcons: Record<string, typeof Wallet> = {
    DRAWER: Wallet,
    MPESA: Wallet,
    SAFE: PiggyBank,
    BANK: Landmark,
}

const money = (value: number) => value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

export function CashRegisterManager({ onBack }: CashRegisterManagerProps) {
    const activeShop = useAppStore((state) => state.activeShop)
    const activeShift = useAppStore((state) => state.activeShift)
    const { accounts = [], isLoading, refetch } = useRegisterAccounts(activeShop?.id)
    const { initialized, isLoading: initLoading, refetch: refetchInit } = useRegisterInitialization(activeShop?.id)
    const [accountId, setAccountId] = useState("")
    const [page, setPage] = useState(1)
    const [showMoveMoney, setShowMoveMoney] = useState(false)
    const [showInitialize, setShowInitialize] = useState(false)
    const canInitialize = ["manager", "admin", "owner"].includes(
        (activeShop?.role || "").toLowerCase()
    )

    useEffect(() => {
        if (accounts.length > 0 && !accounts.some((a) => a.id === accountId)) {
            setAccountId(accounts[0].id)
            setPage(1)
        }
    }, [accounts, accountId])

    const { entries = [], pagination, isLoading: entriesLoading } = useLedgerStatement(
        accountId || undefined,
        { page, limit: 20 }
    )

    const selected = accounts.find((a) => a.id === accountId)

    const handleMoveMoney = () => {
        if (!activeShift) {
            toast.error("Open a shift before moving money")
            return
        }
        setShowMoveMoney(true)
    }

    return (
        <div className="flex flex-col h-full bg-muted/30">
            <div className="bg-card border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-10 h-16">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                )}
                <div className="flex-1">
                    <h2 className="text-xl font-bold tracking-tight">Cash Register</h2>
                </div>
                {initialized && canInitialize && (
                    <Button variant="outline" onClick={() => setShowInitialize(true)} className="gap-2">
                        <Settings2 className="h-4 w-4" />
                        Set Balances
                    </Button>
                )}
                <Button onClick={handleMoveMoney} className="gap-2">
                    <ArrowRightLeft className="h-4 w-4" />
                    Move Money
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
                <div className="max-w-5xl mx-auto space-y-6">
                    {!activeShift && (
                        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                            Open a shift to record money movements. Balances below remain viewable.
                        </div>
                    )}

                    {!initLoading && !initialized && accounts.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-4">
                            <div className="flex items-start gap-2 flex-1">
                                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                                        Register not initialized
                                    </p>
                                    <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                                        Set the actual cash, M-Pesa, bank, and safe balances so reports start from reality.
                                    </p>
                                </div>
                            </div>
                            {canInitialize && (
                                <Button size="sm" onClick={() => setShowInitialize(true)}>
                                    Set opening balances
                                </Button>
                            )}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                            <p className="text-muted-foreground">Loading accounts...</p>
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl bg-card/50 px-6">
                            <div className="bg-primary/5 p-6 rounded-full mb-6">
                                <Wallet className="h-16 w-16 text-primary/20" />
                            </div>
                            <h3 className="text-2xl font-bold">No register accounts yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                                Initialize the register to create the drawer, M-Pesa, bank, and safe
                                accounts with their opening balances.
                            </p>
                            {canInitialize && (
                                <Button onClick={() => setShowInitialize(true)} className="gap-2">
                                    <Settings2 className="h-4 w-4" />
                                    Initialize Register
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {accounts.map((account) => {
                                    const Icon = accountIcons[account.account_type] || Wallet
                                    const isSelected = account.id === accountId
                                    return (
                                        <Card
                                            key={account.id}
                                            className={cn(
                                                "cursor-pointer transition-colors",
                                                isSelected ? "border-primary shadow-sm" : "hover:border-primary/50"
                                            )}
                                            onClick={() => { setAccountId(account.id); setPage(1) }}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Icon className="h-4 w-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">
                                                        {account.account_type}
                                                    </span>
                                                </div>
                                                <div
                                                    className={cn(
                                                        "mt-2 text-lg sm:text-xl font-black tabular-nums tracking-tight truncate",
                                                        account.balance < 0 ? "text-destructive" : "text-foreground"
                                                    )}
                                                    title={`${account.currency} ${money(account.balance)}`}
                                                >
                                                    {account.currency} {money(account.balance)}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-xl font-semibold">Statement</h2>
                                <div className="w-[280px]">
                                    <Select value={accountId} onValueChange={(v) => { setAccountId(v); setPage(1) }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.map((a) => (
                                                <SelectItem key={a.id} value={a.id}>
                                                    {a.account_type} — {a.currency} {money(a.balance)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {entriesLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : entries.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl bg-card/50 px-6">
                                    <h3 className="text-2xl font-bold">No entries</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto">
                                        No entries{selected ? ` for ${selected.account_type}` : ""} yet.
                                    </p>
                                </div>
                            ) : (
                                <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
                                    <div className="grid grid-cols-12 p-4 border-b bg-muted/40 font-medium text-sm text-muted-foreground gap-4">
                                        <div className="col-span-3">Recorded</div>
                                        <div className="col-span-2">Type</div>
                                        <div className="col-span-2 text-right">Amount</div>
                                        <div className="col-span-2 text-right">Balance</div>
                                        <div className="col-span-3">Reference</div>
                                    </div>
                                    <div className="divide-y">
                                        {entries.map((entry) => (
                                            <div key={entry.id} className="grid grid-cols-12 p-4 items-center hover:bg-muted/50 transition-colors text-sm gap-4">
                                                <div className="col-span-3 text-muted-foreground text-xs">
                                                    {entry.recorded_at
                                                        ? new Date(entry.recorded_at).toLocaleString("en-US", {
                                                            month: "short", day: "numeric", hour: "numeric",
                                                            minute: "numeric", hour12: true,
                                                        })
                                                        : "-"}
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                                                        {entry.type}
                                                    </span>
                                                </div>
                                                <div className={cn(
                                                    "col-span-2 text-right font-bold tabular-nums text-xs sm:text-sm whitespace-nowrap",
                                                    entry.amount_minor < 0 ? "text-red-600" : "text-emerald-600"
                                                )}>
                                                    {entry.amount_minor < 0 ? "-" : "+"}
                                                    {selected?.currency || ""} {money(Math.abs(entry.amount_minor) / 100)}
                                                </div>
                                                <div className="col-span-2 text-right font-semibold tabular-nums text-xs sm:text-sm whitespace-nowrap">
                                                    {selected?.currency || ""} {money(entry.running)}
                                                </div>
                                                <div className="col-span-3 text-muted-foreground truncate text-xs" title={entry.notes || ""}>
                                                    {entry.notes || "-"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-4">
                                        <ListPagination pagination={pagination} onPageChange={setPage} />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <MoveMoneyDialog
                open={showMoveMoney}
                onOpenChange={setShowMoveMoney}
                shopId={activeShop?.id}
                onSuccess={() => { refetch(); setPage(1) }}
            />

            <InitializeRegisterDialog
                open={showInitialize}
                onOpenChange={setShowInitialize}
                shopId={activeShop?.id}
                onSuccess={() => { refetch(); refetchInit(); setPage(1) }}
            />
        </div>
    )
}
