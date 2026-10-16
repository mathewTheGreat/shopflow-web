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
import { Loader2 } from "lucide-react"

interface ReasonDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    confirmLabel?: string
    placeholder?: string
    isSubmitting?: boolean
    onSubmit: (reason: string) => void | Promise<void>
}

// Standard reason prompt used by every reversal / audit-trail action.
// Replaces window.prompt: same shape everywhere, required input with inline
// validation, Enter to submit, and no browser-native dialogs.
export function ReasonDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirm",
    placeholder = "Type the reason...",
    isSubmitting = false,
    onSubmit,
}: ReasonDialogProps) {
    const [reason, setReason] = useState("")
    const [touched, setTouched] = useState(false)

    useEffect(() => {
        if (open) {
            setReason("")
            setTouched(false)
        }
    }, [open ])

    const trimmed = reason.trim()
    const showError = touched && !trimmed

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        setTouched(true)
        if (!trimmed || isSubmitting) return
        await onSubmit(trimmed)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        {description && <DialogDescription>{description}</DialogDescription>}
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <Label htmlFor="reason-dialog-input">Reason (required)</Label>
                        <Input
                            id="reason-dialog-input"
                            autoFocus
                            placeholder={placeholder}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            aria-invalid={showError}
                        />
                        {showError && (
                            <p className="text-sm text-destructive">A reason is required — it is kept in the audit trail.</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!trimmed || isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
