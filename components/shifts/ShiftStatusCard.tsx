"use client"

import { Calendar, Lock, LockOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ShiftStatusCardProps {
    shiftOpen: boolean
    startTime?: string
    onOpenShift: () => void
    onCloseShift: () => void
}

export function ShiftStatusCard({ shiftOpen, startTime, onOpenShift, onCloseShift }: ShiftStatusCardProps) {
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

    return (
        <Card className="bg-card border-none shadow-sm w-full">
            <CardContent className="p-6 md:p-10 lg:p-12">
                <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <Calendar className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    <span className="text-sm md:text-base font-medium">Shift Status</span>
                </div>

                {shiftOpen ? (
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
