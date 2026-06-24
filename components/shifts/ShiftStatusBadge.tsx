import { Badge } from "@/components/ui/badge"

interface ShiftStatusBadgeProps {
    closing_status?: string | null
    rejection_reasons?: Array<{ type: string; message: string; record_id?: string }> | null
}

const statusMap = {
    APPROVED: { label: "Approved", className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" },
    PENDING_APPROVAL: { label: "Pending Approval", className: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" },
    AMENDMENT_REQUESTED: { label: "Amendment Requested", className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" },
    OPEN: { label: "Open", className: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700" },
}

export function ShiftStatusBadge({ closing_status, rejection_reasons }: ShiftStatusBadgeProps) {
    const key = closing_status === "APPROVED"
        ? "APPROVED"
        : closing_status === "PENDING_APPROVAL"
            ? "PENDING_APPROVAL"
            : closing_status === "AMENDMENT_REQUESTED"
                ? "AMENDMENT_REQUESTED"
                : "OPEN"

    const { label, className } = statusMap[key]

    return <Badge variant="outline" className={className}>{label}</Badge>
}
