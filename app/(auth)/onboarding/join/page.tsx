"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Store, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function JoinBusinessPage() {
    const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)

    return (
        <div className="flex flex-col items-center space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Join a Business</h1>
                <p className="text-sm text-muted-foreground">Select a business to join from the list below</p>
            </div>

            <div className="w-full space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search businesses..." className="pl-10 h-14 bg-muted border-0 text-base" />
                </div>

                <div className="space-y-3 pt-2">
                    <Card
                        className={`bg-card border transition-all cursor-pointer ${selectedBusiness === 'enchoro' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-border hover:border-muted-foreground/50'}`}
                        onClick={() => setSelectedBusiness('enchoro')}
                    >
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center">
                                <Store className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">ENCHORO EMUNY DAIRIES LTD</h3>
                                <p className="text-xs text-muted-foreground">Ngong • N/A members</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="w-full pt-8">
                <Link href="/">
                    <Button
                        className="w-full h-14 text-base bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={!selectedBusiness}
                    >
                        <ArrowRight className="mr-2 h-5 w-5" />
                        Continue
                    </Button>
                </Link>
            </div>

        </div>
    )
}
