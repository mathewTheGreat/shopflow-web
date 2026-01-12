"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function RoleSelectionPage() {
    const [selectedRole, setSelectedRole] = useState<"manager" | "cashier" | null>(null)

    return (
        <div className="flex flex-col items-center space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Select Your Role</h1>
                <p className="text-sm text-muted-foreground">Choose your position in your shop</p>
            </div>

            <div className="w-full space-y-4">
                <Card
                    className={`bg-card border transition-all cursor-pointer ${selectedRole === 'manager' ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-muted-foreground/50'}`}
                    onClick={() => setSelectedRole('manager')}
                >
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-1">Manager</h3>
                        <p className="text-sm text-muted-foreground">Full access to manage shop</p>
                    </CardContent>
                </Card>

                <Card
                    className={`bg-card border transition-all cursor-pointer ${selectedRole === 'cashier' ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-muted-foreground/50'}`}
                    onClick={() => setSelectedRole('cashier')}
                >
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-1">Cashier</h3>
                        <p className="text-sm text-muted-foreground">Handle sales and customers</p>
                    </CardContent>
                </Card>
            </div>

            <div className="w-full pt-8">
                <Link href="/">
                    <Button
                        className="w-full h-14 text-base bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={!selectedRole}
                    >
                        <ArrowRight className="mr-2 h-5 w-5" />
                        Complete Setup
                    </Button>
                </Link>
            </div>

        </div>
    )
}
