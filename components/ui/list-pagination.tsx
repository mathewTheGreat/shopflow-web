"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

import type { PaginationInfo } from "@/types/list"

interface ListPaginationProps {
    pagination?: PaginationInfo
    onPageChange: (page: number) => void
}

// Server-driven pager shared by every list/grid. Renders nothing for a
// single page, so small lists stay visually unchanged.
export function ListPagination({ pagination, onPageChange }: ListPaginationProps) {
    if (!pagination || pagination.total_pages <= 1) return null

    const { page, limit, total, total_pages } = pagination
    const from = total === 0 ? 0 : (page - 1) * limit + 1
    const to = Math.min(page * limit, total)

    return (
        <div className="flex items-center justify-between py-3 text-sm text-muted-foreground">
            <div>
                Showing {from} to {to} of {total}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                </Button>
                <span>
                    Page {page} of {total_pages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= total_pages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </div>
    )
}
