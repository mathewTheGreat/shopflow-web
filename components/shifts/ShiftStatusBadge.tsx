import { Badge } from "@/components/ui/badge"

interface ShiftStatusBadgeProps {
    closing_status?: string | null
    rejection_reason?: string | null
}

const statusMap = {
    APPROVED: { label: "Approved", className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" },
    PENDING_APPROVAL: { label: "Pending Approval", className: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" },
    PENDING_CORRECTION_APPROVAL: { label: "Correction Review", className: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" },
    ABANDONED: { label: "Discarded (Empty)", className: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700" },
    REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" },
    OPEN: { label: "Open", className: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700" },
}

export function ShiftStatusBadge({ closing_status, rejection_reason }: ShiftStatusBadgeProps) {
    const key = closing_status === "APPROVED"
        ? "APPROVED"
        : closing_status === "PENDING_APPROVAL"
            ? "PENDING_APPROVAL"
            : closing_status === "PENDING_CORRECTION_APPROVAL"
                ? "PENDING_CORRECTION_APPROVAL"
                : closing_status === "ABANDONED"
                    ? "ABANDONED"
                    : rejection_reason
                        ? "REJECTED"
                        : "OPEN"

    const { label, className } = statusMap[key]

    return <Badge variant="outline" className={className}>{label}</Badge>
}
