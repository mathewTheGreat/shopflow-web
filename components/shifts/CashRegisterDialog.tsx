"use client"

import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useRegisterAccounts, useLedgerStatement } from "@/hooks/use-cash-ledger"
import { ListPagination } from "@/components/ui/list-pagination"
import { Loader2, Wallet, PiggyBank, Landmark } from "lucide-react"
import { cn } from "@/lib/utils"

interface CashRegisterDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shopId: string | undefined
}

const accountIcons: Record<string, typeof Wallet> = {
    DRAWER: Wallet,
    SAFE: PiggyBank,
    BANK: Landmark,
    MPESA: Wallet,
}

export function CashRegisterDialog({ open, onOpenChange, shopId }: CashRegisterDialogProps) {
    const { accounts = [], isLoading: accountsLoading } = useRegisterAccounts(open ? shopId : undefined)
    const [accountId, setAccountId] = useState<string>("")
    const [page, setPage] = useState(1)

    useEffect(() => {
        if (open && accounts.length > 0 && !accountId) {
            setAccountId(accounts[0].id)
        }
        if (!open) {
            setPage(1)
        }
    }, [open, accounts, accountId])

    const { entries = [], pagination, isLoading: entriesLoading } = useLedgerStatement(
        open ? accountId || undefined : undefined,
        { page, limit: 20 }
    )

    const selected = accounts.find((a) => a.id === accountId)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cash Register</DialogTitle>
                    <DialogDescription>
                        Live running balances per account, with the full entry statement underneath.
                    </DialogDescription>
                </DialogHeader>
                {accountsLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : accounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">
                        No register accounts yet. Record a bank deposit or float movement and the
                        drawer and bank accounts will appear here.
                    </p>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {accounts.map((account) => {
                                const Icon = accountIcons[account.account_type] || Wallet
                                return (
                                    <Card
                                        key={account.id}
                                        className={cn(
                                            "cursor-pointer transition-colors",
                                            account.id === accountId && "border-primary"
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
                                            <div className="text-2xl font-black mt-1">
                                                {account.currency} {account.balance.toLocaleString()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">Statement:</span>
                            <Select value={accountId} onValueChange={(v) => { setAccountId(v); setPage(1) }}>
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.account_type} — {a.currency} {a.balance.toLocaleString()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {entriesLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : entries.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No entries{selected ? ` for ${selected.account_type}` : ""} yet.
                            </p>
                        ) : (
                            <div className="border rounded-lg overflow-hidden">
                                <div className="grid grid-cols-12 p-3 border-b bg-muted/40 font-medium text-xs text-muted-foreground gap-2">
                                    <div className="col-span-3">Recorded</div>
                                    <div className="col-span-2">Type</div>
                                    <div className="col-span-2 text-right">Amount</div>
                                    <div className="col-span-2 text-right">Balance</div>
                                    <div className="col-span-3">Reference</div>
                                </div>
                                <div className="divide-y max-h-[320px] overflow-y-auto">
                                    {entries.map((entry) => (
                                        <div key={entry.id} className="grid grid-cols-12 p-3 items-center gap-2 text-sm">
                                            <div className="col-span-3 text-muted-foreground text-xs">
                                                {entry.recorded_at
                                                    ? new Date(entry.recorded_at).toLocaleString('en-US', {
                                                        month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true,
                                                    })
                                                    : "-"}
                                            </div>
                                            <div className="col-span-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                                                    {entry.type}
                                                </span>
                                            </div>
                                            <div className={cn(
                                                "col-span-2 text-right font-bold",
                                                entry.amount_minor < 0 ? "text-red-600" : "text-emerald-600"
                                            )}>
                                                {entry.amount_minor < 0 ? "-" : "+"}
                                                {selected?.currency || ""} {(Math.abs(entry.amount_minor) / 100).toLocaleString()}
                                            </div>
                                            <div className="col-span-2 text-right font-semibold">
                                                {(selected?.currency || "")} {entry.running.toLocaleString()}
                                            </div>
                                            <div className="col-span-3 text-muted-foreground truncate text-xs" title={entry.notes || ""}>
                                                {entry.notes || "-"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <ListPagination pagination={pagination} onPageChange={setPage} />
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
