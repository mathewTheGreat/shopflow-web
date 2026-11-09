"use client"

import { useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/store/use-app-store"
import { shiftService } from "@/services/shift.service"
import { AccountWithBalance, cashLedgerService } from "@/services/cash-ledger.service"
import { useItems } from "@/hooks/use-items"
import { useCustomersByShop } from "@/hooks/use-customers"
import { useSuppliers } from "@/hooks/use-supplier"
import { usePurchaseCorrectionContext } from "@/hooks/use-stock-transactions"
import { Shift } from "@/types/shift"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"

type CorrectionIntent =
    | "DUPLICATE_EVENT"
    | "MISSING_EVENT"
    | "SOURCE_FACT_CORRECTION"
    | "COUNT_CORRECTION"
    | "PHYSICAL_ADJUSTMENT"

type CorrectionAction =
    | "VOID_SALE"
    | "VOID_EXPENSE"
    | "LATE_EXPENSE"
    | "LATE_SALE"
    | "LATE_STOCK_TRANSACTION"
    | "LATE_CASH_MOVEMENT"
    | "LATE_CUSTOMER_TRANSACTION"
    | "REVERSE_STOCK_TRANSACTION"
    | "REVERSE_CASH_MOVEMENT"
    | "REVERSE_CUSTOMER_TRANSACTION"
    | "AMEND_PURCHASE_RECEIPT"
    | "AMEND_RECONCILIATION"
    | "LATE_RECONCILIATION"
    | "RECORD_STOCK_TAKE"
    | "RECORD_PHYSICAL_ADJUSTMENT"

type CorrectionCase = {
    id: string
    status: string
    intent: CorrectionIntent
    reason: string
    actions: Array<{
        id: string
        action_type: string
        status: string
        details?: Record<string, unknown> | null
    }>
    effect_scope?: string
}

type SaleCategory = "IMMEDIATE" | "CREDIT" | "PREPAID"

const actionOptions: Record<CorrectionIntent, Array<{ value: CorrectionAction; label: string }>> = {
    DUPLICATE_EVENT: [
        { value: "VOID_SALE", label: "Remove a duplicate sale" },
        { value: "VOID_EXPENSE", label: "Remove a duplicate expense" },
        { value: "REVERSE_STOCK_TRANSACTION", label: "Reverse a duplicate stock movement" },
        { value: "REVERSE_CASH_MOVEMENT", label: "Reverse a duplicate cash movement" },
        { value: "REVERSE_CUSTOMER_TRANSACTION", label: "Reverse a duplicate customer transaction" },
    ],
    MISSING_EVENT: [
        { value: "LATE_SALE", label: "Record a missing sale" },
        { value: "LATE_EXPENSE", label: "Record a missing expense" },
        { value: "LATE_CASH_MOVEMENT", label: "Record a missing cash movement" },
        { value: "LATE_STOCK_TRANSACTION", label: "Record a missing stock movement" },
        { value: "LATE_CUSTOMER_TRANSACTION", label: "Record a missing customer payment" },
    ],
    SOURCE_FACT_CORRECTION: [
        { value: "AMEND_PURCHASE_RECEIPT", label: "Amend or void a purchase receipt" },
        { value: "VOID_SALE", label: "Correct a sale by voiding it" },
        { value: "VOID_EXPENSE", label: "Correct an expense by voiding it" },
        { value: "LATE_EXPENSE", label: "Add the correct expense" },
        { value: "LATE_SALE", label: "Record the corrected sale" },
        { value: "LATE_CASH_MOVEMENT", label: "Record the corrected cash movement" },
        { value: "REVERSE_STOCK_TRANSACTION", label: "Reverse the incorrect stock movement" },
        { value: "LATE_STOCK_TRANSACTION", label: "Record the corrected stock movement" },
        { value: "REVERSE_CASH_MOVEMENT", label: "Reverse the incorrect cash movement" },
        { value: "REVERSE_CUSTOMER_TRANSACTION", label: "Reverse the incorrect customer transaction" },
        { value: "LATE_CUSTOMER_TRANSACTION", label: "Record the corrected customer payment" },
    ],
    COUNT_CORRECTION: [
        { value: "AMEND_RECONCILIATION", label: "Correct recorded cash counts" },
        { value: "LATE_RECONCILIATION", label: "Record a missing closing count" },
        { value: "RECORD_STOCK_TAKE", label: "Correct a physical stock count" },
    ],
    PHYSICAL_ADJUSTMENT: [
        { value: "RECORD_PHYSICAL_ADJUSTMENT", label: "Record a real cash or stock difference" },
    ],
}

function getEffectScope(
    action: CorrectionAction,
    adjustPurchaseStock = false,
    latePurchaseEntry = false,
    adjustLatePurchaseStock = false,
) {
    if (action === "AMEND_PURCHASE_RECEIPT") {
        return adjustPurchaseStock ? "REPORT_AND_OPERATIONAL" as const : "REPORT_ONLY" as const
    }
    if (action === "LATE_STOCK_TRANSACTION" && latePurchaseEntry) {
        return adjustLatePurchaseStock ? "REPORT_AND_OPERATIONAL" as const : "REPORT_ONLY" as const
    }
    return action === "AMEND_RECONCILIATION" || action === "LATE_RECONCILIATION" || action === "RECORD_STOCK_TAKE"
        ? "REPORT_ONLY" as const
        : "REPORT_AND_OPERATIONAL" as const
}

export function CorrectionCasePanel({
    targetShift,
    recordedShiftId,
}: {
    targetShift: Shift
    recordedShiftId?: string
}) {
    const { activeShop, userInfo } = useAppStore()
    const { items } = useItems()
    const { customers } = useCustomersByShop(activeShop?.id)
    const { suppliers = [] } = useSuppliers()
    const queryClient = useQueryClient()
    const [intent, setIntent] = useState<CorrectionIntent>("DUPLICATE_EVENT")
    const [actionType, setActionType] = useState<CorrectionAction>("VOID_SALE")
    const [reason, setReason] = useState("")
    const [evidence, setEvidence] = useState("")
    const [targetId, setTargetId] = useState("")
    const [amount, setAmount] = useState("")
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState("general")
    const [movementType, setMovementType] = useState<"PAY_IN" | "PAY_OUT" | "FLOAT_IN">("PAY_IN")
    const [stockDirection, setStockDirection] = useState<"IN" | "OUT">("IN")
    const [stockEntryKind, setStockEntryKind] = useState<"MOVEMENT" | "FARMER_PURCHASE">("MOVEMENT")
    const [selectedSupplierId, setSelectedSupplierId] = useState("")
    const [adjustLatePurchaseStock, setAdjustLatePurchaseStock] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MPESA">("CASH")
    const [customerPaymentMethod, setCustomerPaymentMethod] = useState<"CASH" | "MPESA" | "CARD" | "BANK_TRANSFER" | "OTHER">("CASH")
    const [saleCategory, setSaleCategory] = useState<SaleCategory>("IMMEDIATE")
    const [selectedCustomerId, setSelectedCustomerId] = useState("")
    const [selectedItemId, setSelectedItemId] = useState("")
    const [quantity, setQuantity] = useState("")
    const [voidPurchaseReceipt, setVoidPurchaseReceipt] = useState(false)
    const [adjustPurchaseStock, setAdjustPurchaseStock] = useState(false)
    const [purchaseAdjustmentIds, setPurchaseAdjustmentIds] = useState<string[]>([])
    const [unitPrice, setUnitPrice] = useState("")
    const [cashAmount, setCashAmount] = useState("")
    const [mpesaAmount, setMpesaAmount] = useState("")
    const [actualCash, setActualCash] = useState("")
    const [actualMpesa, setActualMpesa] = useState("")
    const [adjustmentTarget, setAdjustmentTarget] = useState<"stock" | "cash">("stock")
    const [cashAccountId, setCashAccountId] = useState("")
    const [cashAccounts, setCashAccounts] = useState<AccountWithBalance[]>([])
    const [cases, setCases] = useState<CorrectionCase[]>([])
    const [caseId, setCaseId] = useState("")
    const [caseIdempotencyKey, setCaseIdempotencyKey] = useState(uuidv4())
    const [actionIdempotencyKey, setActionIdempotencyKey] = useState(uuidv4())
    const [busy, setBusy] = useState(false)

    const activeCase = useMemo(() => cases.find((record) => record.id === caseId), [cases, caseId])
    const actions = actionOptions[intent]
    const purchaseContextQuery = usePurchaseCorrectionContext(
        actionType === "AMEND_PURCHASE_RECEIPT" ? targetId.trim() || null : null,
        selectedItemId || undefined,
    )

    useEffect(() => {
        setCaseId("")
        setCases([])
        setIntent("DUPLICATE_EVENT")
        setActionType("VOID_SALE")
        setCaseIdempotencyKey(uuidv4())
        setActionIdempotencyKey(uuidv4())
        if (!activeShop?.id) return
        shiftService.getCorrectionCases(activeShop.id, targetShift.id)
            .then((records) => {
                const loaded = records as CorrectionCase[]
                setCases(loaded)
                const editable = loaded.find((record) => ["OPEN", "APPLIED", "FAILED"].includes(record.status))
                if (editable) {
                    setCaseId(editable.id)
                    setIntent(editable.intent)
                    const latestAction = editable.actions?.[0]
                    const initialAction = actionOptions[editable.intent][0].value
                    const matchingAction = latestAction
                        && actionOptions[editable.intent].some((option) => option.value === latestAction.action_type)
                        ? latestAction.action_type as CorrectionAction
                        : initialAction
                    setActionType(matchingAction)
                    setAdjustPurchaseStock(editable.effect_scope === "REPORT_AND_OPERATIONAL")
                    const isLatePurchase = latestAction?.details?.late_purchase === true
                        || (!latestAction && matchingAction === "LATE_STOCK_TRANSACTION" && editable.effect_scope === "REPORT_ONLY")
                    setStockEntryKind(isLatePurchase ? "FARMER_PURCHASE" : "MOVEMENT")
                    setAdjustLatePurchaseStock(latestAction
                        ? latestAction.details?.stock_adjustment_applied === true
                        : editable.effect_scope === "REPORT_AND_OPERATIONAL")
                }
            })
            .catch((error: Error) => toast.error(error.message || "Could not load correction cases"))
    }, [activeShop?.id, targetShift.id])

    useEffect(() => {
        if (!activeShop?.id) {
            setCashAccounts([])
            return
        }
        cashLedgerService.listAccounts(activeShop.id)
            .then((accounts) => setCashAccounts(accounts.filter((account) => account.is_active)))
            .catch((error: Error) => toast.error(error.message || "Could not load register accounts"))
    }, [activeShop?.id])

    const startCase = async () => {
        if (!activeShop?.id || !userInfo?.id) return
        if (targetShift.closing_status === "APPROVED") {
            toast.error("A manager must reject this approved shift before it can be corrected")
            return
        }
        if (!reason.trim()) {
            toast.error("Describe what was wrong before starting the correction")
            return
        }
        setBusy(true)
        try {
            const created = await shiftService.createCorrectionCase({
                shopId: activeShop.id,
                responsibleShiftId: targetShift.id,
                recordedShiftId,
                intent,
                effectScope: getEffectScope(
                    actionType,
                    adjustPurchaseStock,
                    stockEntryKind === "FARMER_PURCHASE",
                    adjustLatePurchaseStock,
                ),
                reason: reason.trim(),
                evidence: evidence.trim() || undefined,
                idempotencyKey: caseIdempotencyKey,
            }) as CorrectionCase
            created.actions = created.actions || []
            created.intent = intent
            created.effect_scope = getEffectScope(
                actionType,
                adjustPurchaseStock,
                stockEntryKind === "FARMER_PURCHASE",
                adjustLatePurchaseStock,
            )
            setCaseIdempotencyKey(uuidv4())
            setCases((previous) => [created, ...previous.filter((record) => record.id !== created.id)])
            setCaseId(created.id)
            toast.success("Correction case started. Review the action and record it below.")
        } catch (error: any) {
            toast.error(error.message || "Could not start correction case")
        } finally {
            setBusy(false)
        }
    }

    const recordAction = async () => {
        if (!activeCase || !userInfo?.id) return
        let actionData: Record<string, unknown>
        if (["VOID_SALE", "VOID_EXPENSE", "REVERSE_STOCK_TRANSACTION", "REVERSE_CASH_MOVEMENT", "REVERSE_CUSTOMER_TRANSACTION"].includes(actionType)) {
            if (!targetId.trim()) {
                toast.error("Enter the ID of the record being corrected")
                return
            }
            const target = targetId.trim()
            const targetKeys: Record<string, string> = {
                VOID_SALE: "saleId",
                VOID_EXPENSE: "expenseId",
                REVERSE_STOCK_TRANSACTION: "stockTransactionId",
                REVERSE_CASH_MOVEMENT: "cashMovementId",
                REVERSE_CUSTOMER_TRANSACTION: "customerTransactionId",
            }
            actionData = { [targetKeys[actionType]]: target }
        } else if (actionType === "AMEND_PURCHASE_RECEIPT") {
            const parsedQuantity = Number(quantity)
            if (!targetId.trim() || (!voidPurchaseReceipt
                && (!selectedItemId || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0))) {
                toast.error("Enter the purchase transaction ID and a corrected item/positive quantity, or choose to void it")
                return
            }
            actionData = {
                stockTransactionId: targetId.trim(),
                correctedItemId: selectedItemId,
                quantity: voidPurchaseReceipt ? 0 : parsedQuantity,
                void_receipt: voidPurchaseReceipt,
                adjust_stock: adjustPurchaseStock,
                relatedAdjustmentTransactionIds: purchaseAdjustmentIds,
            }
        } else if (actionType === "LATE_SALE") {
            const parsedQuantity = Number(quantity)
            const parsedUnitPrice = Number(unitPrice)
            const selectedItem = items.find((item) => item.id === selectedItemId)
            if (!selectedItem || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0
                || !Number.isFinite(parsedUnitPrice) || parsedUnitPrice <= 0) {
                toast.error("Select an item and enter a valid quantity and unit price")
                return
            }
            const total = parsedQuantity * parsedUnitPrice
            const payments: Array<{ payment_method: string; amount: number }> = []
            if (saleCategory === "IMMEDIATE") {
                const cash = parseFloat(cashAmount) || 0
                const mpesa = parseFloat(mpesaAmount) || 0
                if (Math.abs(cash + mpesa - total) > 0.01) {
                    toast.error(`Payment sum (${cash + mpesa}) must match total (${total})`)
                    return
                }
                if (cash > 0) payments.push({ payment_method: "CASH", amount: cash })
                if (mpesa > 0) payments.push({ payment_method: "MPESA", amount: mpesa })
                if (payments.length === 0) {
                    toast.error("Enter at least one cash or M-Pesa payment")
                    return
                }
            } else if ((saleCategory === "CREDIT" || saleCategory === "PREPAID") && !selectedCustomerId) {
                toast.error("Select a customer for Credit/Prepaid sales")
                return
            }
            actionData = {
                saleData: {
                    sale_date: new Date().toISOString(),
                    occurred_at: new Date().toISOString(),
                    total_amount: total,
                    sale_category: saleCategory,
                    customer_id: selectedCustomerId || undefined,
                    _lastModifiedAt: new Date().toISOString(),
                    _version: 1,
                    _isPending: false,
                },
                items: [{
                    item_id: selectedItem.id,
                    quantity: parsedQuantity,
                    unit_price: parsedUnitPrice,
                    total_price: total,
                }],
                payments,
            }
        } else if (actionType === "LATE_STOCK_TRANSACTION") {
            const parsedQuantity = Number(quantity)
            const isFarmerPurchase = stockEntryKind === "FARMER_PURCHASE"
            if (!activeShop?.id || !selectedItemId || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
                toast.error("Select an item and enter a valid positive quantity")
                return
            }
            if (isFarmerPurchase && !selectedSupplierId) {
                toast.error("Select the farmer or supplier for this purchase")
                return
            }
            actionData = {
                transaction: {
                    type: isFarmerPurchase ? "IN" : stockDirection,
                    item_id: selectedItemId,
                    shop_id: activeShop.id,
                    quantity: parsedQuantity,
                    reason: isFarmerPurchase ? "PURCHASE" : "ADJUSTMENT",
                    supplier_id: isFarmerPurchase ? selectedSupplierId : null,
                },
                adjust_stock: isFarmerPurchase ? adjustLatePurchaseStock : true,
            }
        } else if (actionType === "RECORD_STOCK_TAKE") {
            const countedQuantity = Number(quantity)
            if (!selectedItemId || !Number.isFinite(countedQuantity) || countedQuantity < 0) {
                toast.error("Select an item and enter a non-negative counted quantity")
                return
            }
            actionData = {
                stockTake: {
                    item_id: selectedItemId,
                    counted_qty: countedQuantity,
                },
            }
        } else if (actionType === "RECORD_PHYSICAL_ADJUSTMENT") {
            if (adjustmentTarget === "cash") {
                const signedAmount = Number(amount)
                if (!cashAccountId.trim() || !Number.isFinite(signedAmount) || signedAmount === 0) {
                    toast.error("Enter a cash account ID and a non-zero signed amount")
                    return
                }
                actionData = { targetType: "cash", account_id: cashAccountId.trim(), amount: signedAmount }
            } else {
                const signedQuantity = Number(quantity)
                if (!selectedItemId || !Number.isFinite(signedQuantity) || signedQuantity === 0) {
                    toast.error("Select an item and enter a non-zero signed stock quantity")
                    return
                }
                actionData = {
                    targetType: "stock",
                    stockTake: { item_id: selectedItemId, quantity: signedQuantity },
                }
            }
        } else if (actionType === "LATE_EXPENSE") {
            const parsedAmount = Number(amount)
            if (!description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
                toast.error("Enter a description and a valid positive expense amount")
                return
            }
            actionData = {
                expense: {
                    amount: parsedAmount,
                    description: description.trim(),
                    category,
                    expense_date: new Date().toISOString(),
                },
            }
        } else if (actionType === "LATE_CASH_MOVEMENT") {
            const parsedAmount = Number(amount)
            if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
                toast.error("Enter a valid positive amount")
                return
            }
            actionData = { movement: { type: movementType, amount: parsedAmount, payment_method: paymentMethod } }
        } else if (actionType === "LATE_CUSTOMER_TRANSACTION") {
            const parsedAmount = Number(amount)
            if (!selectedCustomerId || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
                toast.error("Select a customer and enter a valid positive amount")
                return
            }
            actionData = {
                customerId: selectedCustomerId,
                paymentMethod: customerPaymentMethod,
                amount: parsedAmount,
            }
        } else {
            const cash = Number(actualCash)
            const mpesa = Number(actualMpesa)
            if (!Number.isFinite(cash) || cash < 0 || !Number.isFinite(mpesa) || mpesa < 0) {
                toast.error("Enter valid non-negative cash and M-Pesa counts")
                return
            }
            actionData = { actual_cash_amount: cash, actual_mpesa_amount: mpesa }
        }

        if (intent === "SOURCE_FACT_CORRECTION"
            && ["LATE_SALE", "LATE_EXPENSE", "LATE_STOCK_TRANSACTION", "LATE_CASH_MOVEMENT", "LATE_CUSTOMER_TRANSACTION"].includes(actionType)
            && targetId.trim()) {
            actionData = { ...actionData, replacesEventId: targetId.trim() }
        }

        setBusy(true)
        try {
            const action = await shiftService.executeCorrectionAction(activeCase.id, {
                actionType,
                idempotencyKey: actionIdempotencyKey,
                actionData,
            })
            setActionIdempotencyKey(uuidv4())
            setCases((previous) => previous.map((record) => record.id === activeCase.id
                ? { ...record, status: "APPLIED", actions: [...record.actions, action] }
                : record))
            toast.success("Correction action recorded. Add any related action before submitting for review.")
        } catch (error: any) {
            toast.error(error.message || "Could not record correction action")
        } finally {
            setBusy(false)
        }
    }

    const submitForReview = async () => {
        if (!activeCase) return
        setBusy(true)
        try {
            const updated = await shiftService.submitCorrectionCase(activeCase.id) as CorrectionCase
            setCases((previous) => previous.map((record) => record.id === activeCase.id ? { ...record, ...updated } : record))
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["pending-approvals"] }),
                queryClient.invalidateQueries({ queryKey: ["rejected-shifts-v2"] }),
                queryClient.invalidateQueries({ queryKey: ["current-shift"] }),
            ])
            toast.success("Correction submitted with the shift for manager review.")
        } catch (error: any) {
            toast.error(error.message || "Could not submit correction for review")
        } finally {
            setBusy(false)
        }
    }

    const canEdit = activeCase && ["OPEN", "APPLIED", "FAILED"].includes(activeCase.status)

    return (
        <Card className="border-primary/30 shadow-sm">
            <CardContent className="space-y-4 p-4">
                <div>
                    <h3 className="font-semibold">Guided correction</h3>
                    <p className="text-sm text-muted-foreground">
                        State what happened, record the affected business event, then send the case through shift review.
                    </p>
                </div>

                {cases.length > 0 && (
                    <div className="space-y-1">
                        <Label htmlFor="correction-case">Existing case for this shift</Label>
                        <select
                            id="correction-case"
                            value={caseId}
                            onChange={(event) => {
                                const nextId = event.target.value
                                const selected = cases.find((record) => record.id === nextId)
                                setCaseId(nextId)
                                if (selected) {
                                    setIntent(selected.intent)
                                    setAdjustPurchaseStock(selected.effect_scope === "REPORT_AND_OPERATIONAL")
                                    const nextAction = selected.actions?.[0]?.action_type
                                    const matchingAction = actionOptions[selected.intent].some((option) => option.value === nextAction)
                                        ? nextAction as CorrectionAction
                                        : actionOptions[selected.intent][0].value
                                    setActionType(matchingAction)
                                    const latestAction = selected.actions?.[0]
                                    const isLatePurchase = latestAction?.details?.late_purchase === true
                                        || (!latestAction && matchingAction === "LATE_STOCK_TRANSACTION" && selected.effect_scope === "REPORT_ONLY")
                                    setStockEntryKind(isLatePurchase ? "FARMER_PURCHASE" : "MOVEMENT")
                                    setAdjustLatePurchaseStock(latestAction
                                        ? latestAction.details?.stock_adjustment_applied === true
                                        : selected.effect_scope === "REPORT_AND_OPERATIONAL")
                                }
                            }}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">Start a new correction case</option>
                            {cases.map((record) => (
                                <option key={record.id} value={record.id}>
                                {record.status} · {record.reason} · {record.id.slice(0, 8)}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {!activeCase && (
                    <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label htmlFor="correction-intent">What happened?</Label>
                                <select
                                    id="correction-intent"
                                    value={intent}
                                    onChange={(event) => {
                                        const next = event.target.value as CorrectionIntent
                                        setIntent(next)
                                        setActionType(actionOptions[next][0].value)
                                        setStockEntryKind("MOVEMENT")
                                        setSelectedSupplierId("")
                                        setAdjustLatePurchaseStock(false)
                                        setSaleCategory("IMMEDIATE")
                                        setSelectedCustomerId("")
                                        setCashAmount("")
                                        setMpesaAmount("")
                                    }}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="DUPLICATE_EVENT">A duplicate was recorded</option>
                                    <option value="MISSING_EVENT">Something was missed</option>
                                    <option value="SOURCE_FACT_CORRECTION">A recorded fact is wrong</option>
                                    <option value="COUNT_CORRECTION">A closing count is wrong</option>
                                    <option value="PHYSICAL_ADJUSTMENT">There was a real cash or stock difference</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="correction-action">What needs to change?</Label>
                                <select
                                    id="correction-action"
                                    value={actionType}
                                    onChange={(event) => {
                                        const nextAction = event.target.value as CorrectionAction
                                        setActionType(nextAction)
                                        setStockEntryKind("MOVEMENT")
                                        setSelectedSupplierId("")
                                        setAdjustLatePurchaseStock(false)
                                        setVoidPurchaseReceipt(false)
                                    }}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    {actions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}
                                </select>
                            </div>
                        </div>
                        {actionType === "LATE_STOCK_TRANSACTION" && (
                            <div className="space-y-1">
                                <Label htmlFor="correction-stock-entry-kind">Stock entry type</Label>
                                <select
                                    id="correction-stock-entry-kind"
                                    value={stockEntryKind}
                                    onChange={(event) => {
                                        const nextKind = event.target.value as typeof stockEntryKind
                                        setStockEntryKind(nextKind)
                                        if (nextKind === "FARMER_PURCHASE") {
                                            setStockDirection("IN")
                                            setAdjustLatePurchaseStock(false)
                                        } else {
                                            setSelectedSupplierId("")
                                        }
                                    }}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="MOVEMENT">Other stock movement</option>
                                    <option value="FARMER_PURCHASE">Farmer purchase receipt</option>
                                </select>
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label htmlFor="correction-reason">Explain the mistake</Label>
                            <Input id="correction-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Be specific about what actually happened" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="correction-evidence">Evidence or reference (optional)</Label>
                            <Input id="correction-evidence" value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Receipt number, count sheet, or note" />
                        </div>
                        <p className="rounded-md bg-muted p-3 text-sm">
                            {getEffectScope(
                                actionType,
                                adjustPurchaseStock,
                                stockEntryKind === "FARMER_PURCHASE",
                                adjustLatePurchaseStock,
                            ) === "REPORT_ONLY"
                                ? "This corrects the shift record and reports only. It will not adjust current cash or stock."
                                : "This action also affects operational balances, in addition to the corrected shift record."}
                        </p>
                        {actionType === "AMEND_PURCHASE_RECEIPT" && (
                            <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={adjustPurchaseStock}
                                    onChange={(event) => setAdjustPurchaseStock(event.target.checked)}
                                    className="mt-1"
                                />
                                <span>
                                    Also adjust current on-hand stock
                                    <span className="block text-xs text-muted-foreground">Off by default; this also determines the correction case&apos;s effect scope.</span>
                                </span>
                            </label>
                        )}
                        {actionType === "LATE_STOCK_TRANSACTION" && stockEntryKind === "FARMER_PURCHASE" && (
                            <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={adjustLatePurchaseStock}
                                    onChange={(event) => setAdjustLatePurchaseStock(event.target.checked)}
                                    className="mt-1"
                                />
                                <span>
                                    Also add this receipt to current on-hand stock
                                    <span className="block text-xs text-muted-foreground">Off by default because closing stock counts are expected to set the current stock correctly.</span>
                                </span>
                            </label>
                        )}
                        <Button onClick={startCase} disabled={busy || !reason.trim()} className="w-full sm:w-auto">
                            {busy ? "Starting…" : "Start correction"}
                        </Button>
                    </div>
                )}

                {activeCase && (
                    <div className="space-y-3">
                        <p className="text-sm">
                            Case status: <span className="font-medium">{activeCase.status}</span>
                            {" · "}{activeCase.actions?.length || 0} action(s) recorded
                        </p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            {(activeCase.actions || []).map((action) => (
                                <li key={action.id}>{action.action_type.replaceAll("_", " ").toLowerCase()}</li>
                            ))}
                        </ul>
                        {canEdit && (
                            <>
                                <div className="space-y-1">
                                    <Label htmlFor="correction-case-action">Action to record</Label>
                                    <select
                                        id="correction-case-action"
                                        value={actionType}
                                        onChange={(event) => {
                                            const nextAction = event.target.value as CorrectionAction
                                            setActionType(nextAction)
                                            setVoidPurchaseReceipt(false)
                                            setAdjustPurchaseStock(activeCase.effect_scope === "REPORT_AND_OPERATIONAL")
                                            const isReportOnlyLatePurchase = nextAction === "LATE_STOCK_TRANSACTION"
                                                && activeCase.effect_scope === "REPORT_ONLY"
                                            setStockEntryKind(isReportOnlyLatePurchase ? "FARMER_PURCHASE" : "MOVEMENT")
                                            setAdjustLatePurchaseStock(activeCase.effect_scope === "REPORT_AND_OPERATIONAL")
                                        }}
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        {actions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}
                                    </select>
                                </div>
                                {actionType === "RECORD_PHYSICAL_ADJUSTMENT" && (
                                    <div className="space-y-1">
                                        <Label htmlFor="physical-adjustment-target">Adjustment type</Label>
                                        <select id="physical-adjustment-target" value={adjustmentTarget} onChange={(event) => setAdjustmentTarget(event.target.value as typeof adjustmentTarget)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                            <option value="stock">Physical stock difference</option>
                                            <option value="cash">Physical cash difference</option>
                                        </select>
                                    </div>
                                )}
                                {["VOID_SALE", "VOID_EXPENSE", "REVERSE_STOCK_TRANSACTION", "REVERSE_CASH_MOVEMENT", "REVERSE_CUSTOMER_TRANSACTION", "AMEND_PURCHASE_RECEIPT"].includes(actionType) && (
                                    <div className="space-y-1">
                                        <Label htmlFor="correction-target-id">
                                            {actionType === "VOID_SALE" ? "Sale record ID"
                                                : actionType === "VOID_EXPENSE" ? "Expense record ID"
                                                    : actionType === "REVERSE_STOCK_TRANSACTION" ? "Stock transaction ID"
                                                        : actionType === "REVERSE_CASH_MOVEMENT" ? "Cash movement ID"
                                                            : actionType === "AMEND_PURCHASE_RECEIPT" ? "Purchase transaction ID"
                                                                : "Customer transaction ID"}
                                        </Label>
                                        <Input id="correction-target-id" value={targetId} onChange={(event) => {
                                            setTargetId(event.target.value)
                                            setPurchaseAdjustmentIds([])
                                        }} placeholder="Paste the record ID" />
                                    </div>
                                )}
                                {(actionType === "LATE_SALE" || actionType === "LATE_STOCK_TRANSACTION"
                                    || actionType === "RECORD_STOCK_TAKE"
                                    || actionType === "AMEND_PURCHASE_RECEIPT"
                                    || (actionType === "RECORD_PHYSICAL_ADJUSTMENT" && adjustmentTarget === "stock")) && (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {actionType === "LATE_STOCK_TRANSACTION" && (
                                            <div className="space-y-1 sm:col-span-2">
                                                <Label htmlFor="correction-stock-entry-kind">Stock entry type</Label>
                                                <select
                                                    id="correction-stock-entry-kind"
                                                    value={stockEntryKind}
                                                    onChange={(event) => {
                                                        const nextKind = event.target.value as typeof stockEntryKind
                                                        setStockEntryKind(nextKind)
                                                        if (nextKind === "FARMER_PURCHASE") {
                                                            setStockDirection("IN")
                                                            setAdjustLatePurchaseStock(activeCase?.effect_scope === "REPORT_AND_OPERATIONAL")
                                                        } else {
                                                            setSelectedSupplierId("")
                                                        }
                                                    }}
                                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                >
                                                    <option value="MOVEMENT">Other stock movement</option>
                                                    <option value="FARMER_PURCHASE">Farmer purchase receipt</option>
                                                </select>
                                            </div>
                                        )}
                                        <div className="space-y-1 sm:col-span-2">
                                            <Label htmlFor="correction-item">{actionType === "AMEND_PURCHASE_RECEIPT" ? "Corrected purchase item" : "Item"}</Label>
                                            <select
                                                id="correction-item"
                                                value={selectedItemId}
                                                disabled={actionType === "AMEND_PURCHASE_RECEIPT" && voidPurchaseReceipt}
                                                onChange={(event) => {
                                                    setSelectedItemId(event.target.value)
                                                    setPurchaseAdjustmentIds([])
                                                }}
                                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            >
                                                <option value="">Select an item</option>
                                                {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                                            </select>
                                        </div>
                                        {actionType === "LATE_STOCK_TRANSACTION" && stockEntryKind === "FARMER_PURCHASE" && (
                                            <div className="space-y-1 sm:col-span-2">
                                                <Label htmlFor="correction-purchase-supplier">Farmer / supplier</Label>
                                                <select
                                                    id="correction-purchase-supplier"
                                                    value={selectedSupplierId}
                                                    onChange={(event) => setSelectedSupplierId(event.target.value)}
                                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                >
                                                    <option value="">Select a farmer / supplier</option>
                                                    {suppliers
                                                        .filter((supplier) => !supplier.shop_id || supplier.shop_id === activeShop?.id)
                                                        .map((supplier) => (
                                                            <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                                                        ))}
                                                </select>
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <Label htmlFor="correction-quantity">
                                                {actionType === "AMEND_PURCHASE_RECEIPT" ? "Corrected quantity"
                                                    : actionType === "RECORD_STOCK_TAKE" ? "Correct counted quantity"
                                                    : actionType === "RECORD_PHYSICAL_ADJUSTMENT" ? "Signed stock adjustment"
                                                        : "Quantity"}
                                            </Label>
                                            <Input id="correction-quantity" type="number"
                                                min={actionType === "RECORD_PHYSICAL_ADJUSTMENT" ? undefined : "0.01"}
                                                step="0.01" value={quantity}
                                                disabled={actionType === "AMEND_PURCHASE_RECEIPT" && voidPurchaseReceipt}
                                                onChange={(event) => setQuantity(event.target.value)} />
                                        </div>
                                        {actionType === "LATE_SALE" ? (
                                            <>
                                                <div className="space-y-1 sm:col-span-2">
                                                    <Label htmlFor="correction-sale-category">Sale category</Label>
                                                    <select
                                                        id="correction-sale-category"
                                                        value={saleCategory}
                                                        onChange={(event) => setSaleCategory(event.target.value as SaleCategory)}
                                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                    >
                                                        <option value="IMMEDIATE">Immediate (cash/M-Pesa)</option>
                                                        <option value="CREDIT">Credit (customer account)</option>
                                                        <option value="PREPAID">Prepaid (customer account)</option>
                                                    </select>
                                                </div>
                                                {(saleCategory === "CREDIT" || saleCategory === "PREPAID") && (
                                                    <div className="space-y-1 sm:col-span-2">
                                                        <Label htmlFor="correction-customer">Customer</Label>
                                                        <select
                                                            id="correction-customer"
                                                            value={selectedCustomerId}
                                                            onChange={(event) => setSelectedCustomerId(event.target.value)}
                                                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                        >
                                                            <option value="">Select a customer</option>
                                                            {customers.map((customer) => (
                                                                <option key={customer.id} value={customer.id}>{customer.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                                {saleCategory === "IMMEDIATE" && (
                                                    <>
                                                        <div className="space-y-1">
                                                            <Label htmlFor="correction-unit-price">Unit price</Label>
                                                            <Input id="correction-unit-price" type="number" min="0" step="0.01" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} />
                                                        </div>
                                                        <div className="space-y-1 sm:col-span-2">
                                                            <Label htmlFor="correction-cash-amount">Cash amount</Label>
                                                            <Input id="correction-cash-amount" type="number" min="0" step="0.01" value={cashAmount} onChange={(event) => setCashAmount(event.target.value)} placeholder="0" />
                                                        </div>
                                                        <div className="space-y-1 sm:col-span-2">
                                                            <Label htmlFor="correction-mpesa-amount">M-Pesa amount</Label>
                                                            <Input id="correction-mpesa-amount" type="number" min="0" step="0.01" value={mpesaAmount} onChange={(event) => setMpesaAmount(event.target.value)} placeholder="0" />
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        ) : actionType === "LATE_STOCK_TRANSACTION" && stockEntryKind === "MOVEMENT" ? (
                                            <div className="space-y-1">
                                                <Label htmlFor="correction-stock-direction">Stock movement</Label>
                                                <select id="correction-stock-direction" value={stockDirection} onChange={(event) => setStockDirection(event.target.value as typeof stockDirection)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                                    <option value="IN">Stock in</option><option value="OUT">Stock out</option>
                                                </select>
                                            </div>
                                        ) : actionType === "RECORD_PHYSICAL_ADJUSTMENT" ? (
                                            <div className="space-y-1 sm:col-span-2">
                                                <p className="text-sm text-muted-foreground">Use a positive quantity for stock gained and a negative quantity for stock lost.</p>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                                {actionType === "AMEND_PURCHASE_RECEIPT" && (
                                    <div className="space-y-3">
                                        {purchaseContextQuery.isLoading ? (
                                            <p className="text-sm text-muted-foreground">Loading purchase shift records…</p>
                                        ) : purchaseContextQuery.error ? (
                                            <p role="alert" className="text-sm text-destructive">
                                                Could not load purchase context: {purchaseContextQuery.error.message}
                                            </p>
                                        ) : (
                                            <div className="rounded-md border p-3">
                                                <p className="mb-2 text-sm font-medium">Related original-shift adjustments</p>
                                                <ul className="space-y-1 text-sm">
                                                    {(purchaseContextQuery.data?.relatedAdjustments ?? []).map((adjustment) => (
                                                        <li key={adjustment.id} className="flex items-start gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={purchaseAdjustmentIds.includes(adjustment.id)}
                                                                onChange={(event) => setPurchaseAdjustmentIds((ids) => event.target.checked
                                                                    ? [...ids, adjustment.id]
                                                                    : ids.filter((id) => id !== adjustment.id))}
                                                                className="mt-1"
                                                            />
                                                            <span>Exclude automatic adjustment {adjustment.id} from the corrected report.</span>
                                                        </li>
                                                    ))}
                                                    {!purchaseContextQuery.data?.relatedAdjustments.length && (
                                                        <li className="text-muted-foreground">No related adjustments found.</li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                        <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
                                            <input type="checkbox" checked={voidPurchaseReceipt}
                                                onChange={(event) => setVoidPurchaseReceipt(event.target.checked)} className="mt-1" />
                                            <span>Void this receipt; its corrected report quantity will be zero.</span>
                                        </label>
                                        <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
                                            <input type="checkbox" checked={adjustPurchaseStock}
                                                disabled={activeCase.effect_scope !== "REPORT_AND_OPERATIONAL"}
                                                onChange={(event) => setAdjustPurchaseStock(event.target.checked)} className="mt-1" />
                                            <span>Also adjust current on-hand stock.</span>
                                        </label>
                                    </div>
                                )}
                                {actionType === "RECORD_PHYSICAL_ADJUSTMENT" && adjustmentTarget === "cash" && (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label htmlFor="physical-cash-account">Register account</Label>
                                            <select id="physical-cash-account" value={cashAccountId} onChange={(event) => setCashAccountId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                                <option value="">Select an active account</option>
                                                {cashAccounts.map((account) => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.account_type} · {account.currency}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="physical-cash-amount">Signed amount</Label>
                                            <Input id="physical-cash-amount" type="number" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
                                            <p className="text-xs text-muted-foreground">Positive adds to the account; negative removes from it.</p>
                                        </div>
                                    </div>
                                )}
                                {actionType === "LATE_EXPENSE" && (
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="case-expense-amount">Amount</Label>
                                            <Input id="case-expense-amount" type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="case-expense-category">Category</Label>
                                            <Input id="case-expense-category" value={category} onChange={(event) => setCategory(event.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="case-expense-description">Description</Label>
                                            <Input id="case-expense-description" value={description} onChange={(event) => setDescription(event.target.value)} />
                                        </div>
                                    </div>
                                )}
                                {actionType === "LATE_CASH_MOVEMENT" && (
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="case-movement-type">Movement</Label>
                                            <select id="case-movement-type" value={movementType} onChange={(event) => setMovementType(event.target.value as typeof movementType)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                                <option value="PAY_IN">Pay in</option><option value="PAY_OUT">Pay out</option><option value="FLOAT_IN">Float in</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="case-payment-method">Method</Label>
                                            <select id="case-payment-method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                                <option value="CASH">Cash</option><option value="MPESA">M-Pesa</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="case-movement-amount">Amount</Label>
                                            <Input id="case-movement-amount" type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} />
                                        </div>
                                    </div>
                                )}
                                {actionType === "LATE_CUSTOMER_TRANSACTION" && (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label htmlFor="case-customer-transaction-customer">Customer</Label>
                                            <select id="case-customer-transaction-customer" value={selectedCustomerId} onChange={(event) => setSelectedCustomerId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                                <option value="">Select a customer</option>
                                                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="case-customer-transaction-method">Payment method</Label>
                                            <select id="case-customer-transaction-method" value={customerPaymentMethod} onChange={(event) => setCustomerPaymentMethod(event.target.value as typeof customerPaymentMethod)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                                <option value="CASH">Cash</option><option value="MPESA">M-Pesa</option><option value="CARD">Card</option><option value="BANK_TRANSFER">Bank transfer</option><option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="case-customer-transaction-amount">Payment received</Label>
                                            <Input id="case-customer-transaction-amount" type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
                                        </div>
                                    </div>
                                )}
                                {(actionType === "AMEND_RECONCILIATION" || actionType === "LATE_RECONCILIATION") && (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label htmlFor="case-actual-cash">Correct actual cash</Label>
                                            <Input id="case-actual-cash" type="number" min="0" value={actualCash} onChange={(event) => setActualCash(event.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="case-actual-mpesa">Correct actual M-Pesa</Label>
                                            <Input id="case-actual-mpesa" type="number" min="0" value={actualMpesa} onChange={(event) => setActualMpesa(event.target.value)} />
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Button
                                        onClick={recordAction}
                                        disabled={busy || (actionType === "AMEND_PURCHASE_RECEIPT" && (
                                            purchaseContextQuery.isLoading
                                            || !!purchaseContextQuery.error
                                            || !!purchaseContextQuery.data?.isReversed
                                        ))}
                                        className="w-full sm:w-auto"
                                    >
                                        {busy ? "Saving…" : "Record this action"}
                                    </Button>
                                    <Button onClick={submitForReview} disabled={busy || !activeCase.actions?.length} variant="outline" className="w-full sm:w-auto">
                                        Submit case for review
                                    </Button>
                                </div>
                            </>
                        )}
                        {!canEdit && <p className="text-sm text-muted-foreground">This case is with the manager or has already been reviewed.</p>}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
