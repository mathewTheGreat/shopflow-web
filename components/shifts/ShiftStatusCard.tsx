"use client"

import { Calendar, Lock, LockOpen, AlertTriangle, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ShiftStatusCardProps {
    shiftOpen: boolean
    startTime?: string
    onOpenShift: () => void
    onCloseShift: () => void
    closingStatus?: 'OPEN' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
    rejectionReason?: string | null
}

export function ShiftStatusCard({ shiftOpen, startTime, onOpenShift, onCloseShift, closingStatus, rejectionReason }: ShiftStatusCardProps) {
    const formatDateTime = (isoString?: string) => {
        if (!isoString) return ""
        return new Date(isoString).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    const isRejected = closingStatus === 'REJECTED'
    const isPendingApproval = closingStatus === 'PENDING_APPROVAL'
    const isApproved = closingStatus === 'APPROVED'
    const isActive = shiftOpen && !isRejected

    if (isPendingApproval) {
        return (
            <Card className="bg-card border-none shadow-sm w-full">
                <CardContent className="p-6 md:p-10 lg:p-12">
                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                        <Calendar className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        <span className="text-sm md:text-base font-medium">Shift Status</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-5 w-5 md:h-8 md:w-8 text-amber-500" />
                        <span className="text-lg md:text-3xl font-black text-amber-500 uppercase tracking-tight">PENDING APPROVAL</span>
                    </div>
                    <p className="text-sm md:text-lg text-muted-foreground mb-2">Awaiting manager review</p>
                    {startTime && (
                        <p className="text-xs text-muted-foreground">Started: {formatDateTime(startTime)}</p>
                    )}
                </CardContent>
            </Card>
        )
    }

    if (isApproved) {
        return (
            <Card className="bg-card border-none shadow-sm w-full">
                <CardContent className="p-6 md:p-10 lg:p-12">
                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                        <Calendar className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        <span className="text-sm md:text-base font-medium">Shift Status</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-5 w-5 md:h-8 md:w-8 text-emerald-500" />
                        <span className="text-lg md:text-3xl font-black text-emerald-500 uppercase tracking-tight">APPROVED & CLOSED</span>
                    </div>
                    {startTime && (
                        <p className="text-xs text-muted-foreground">Started: {formatDateTime(startTime)}</p>
                    )}
                </CardContent>
            </Card>
        )
    }

    if (isRejected) {
        return (
            <Card className="bg-card border-none shadow-sm w-full">
                <CardContent className="p-6 md:p-10 lg:p-12">
                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                        <Calendar className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        <span className="text-sm md:text-base font-medium">Shift Status</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-5 w-5 md:h-8 md:w-8 text-red-500" />
                        <span className="text-lg md:text-3xl font-black text-red-500 uppercase tracking-tight">REJECTED</span>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3 my-3">
                        <p className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider mb-1">Reason</p>
                        <p className="text-sm text-red-600 dark:text-red-400">{rejectionReason}</p>
                    </div>
                    {startTime && (
                        <p className="text-xs text-muted-foreground mb-4">Started: {formatDateTime(startTime)}</p>
                    )}
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 my-3">
                        <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">Correction Mode</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Entries you record here will be attributed to this shift as corrections.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-card border-none shadow-sm w-full">
            <CardContent className="p-6 md:p-10 lg:p-12">
                <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <Calendar className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    <span className="text-sm md:text-base font-medium">Shift Status</span>
                </div>

                {isActive ? (
                    <>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <LockOpen className="h-5 w-5 md:h-8 md:w-8 text-emerald-500" />
                                <span className="text-lg md:text-3xl font-black text-emerald-500 uppercase tracking-tight">OPEN</span>
                            </div>
                            {startTime && (
                                <div className="text-right">
                                    <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">Started At</p>
                                    <p className="text-xs md:text-sm font-bold text-primary">{formatDateTime(startTime)}</p>
                                </div>
                            )}
                        </div>
                        <p className="text-sm md:text-lg text-muted-foreground mb-8">Active shift in progress</p>
                        <Button
                            onClick={onCloseShift}
                            className="w-full bg-primary hover:bg-primary/90 text-white h-12 md:h-16 lg:h-20 rounded-xl font-bold text-base md:text-xl transition-all duration-300"
                        >
                            <Lock className="mr-2 h-5 w-5 md:h-7 md:w-7 fill-current" />
                            Close Shift
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-1">
                            <Lock className="h-5 w-5 md:h-8 md:w-8 text-red-500" />
                            <span className="text-lg md:text-3xl font-black text-red-500 uppercase tracking-tight">CLOSED</span>
                        </div>
                        <p className="text-sm md:text-lg text-muted-foreground mb-8">No active shift</p>
                        <Button
                            onClick={onOpenShift}
                            className="w-full bg-primary hover:bg-primary/90 text-white h-12 md:h-16 lg:h-20 rounded-xl font-bold text-base md:text-xl transition-all duration-300"
                        >
                            <LockOpen className="mr-2 h-5 w-5 md:h-7 md:w-7 fill-current" />
                            Open Shift
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    )
}