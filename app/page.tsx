"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Menu,
  Calendar,
  Lock,
  LockOpen,
  ShoppingCart,
  Package,
  Store,
  Moon,
  RefreshCw,
  LogOut,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardPage() {
  const [shiftOpen, setShiftOpen] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [cashAmount, setCashAmount] = useState("100")
  const [mpesaAmount, setMpesaAmount] = useState("100")

  const handleOpenShift = () => {
    setShiftOpen(true)
  }

  const handleCloseShift = () => {
    setShowCloseDialog(true)
  }

  const handleSubmitBalances = () => {
    setShowCloseDialog(false)
    setShiftOpen(false)
    setShowSuccessDialog(true)
  }



  return (
    <>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 border-r border-border bg-card p-6">
          <AppSidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-border bg-card">
            <div className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-6">
                    <AppSidebar />
                  </SheetContent>
                </Sheet>
                <h1 className="text-2xl font-medium text-muted-foreground">Dashboard</h1>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto p-4 md:p-6 max-w-7xl">
            <div className="space-y-6">

              {/* Shift Status Card */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground font-normal">
                    <Calendar className="h-5 w-5 text-primary" />
                    Shift Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {shiftOpen ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <LockOpen className="h-5 w-5 text-teal-500" />
                        <span className="text-lg font-medium text-teal-500">OPEN</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">ID: 4e047dfe-f56a-402a-b07e-a760dded4e38</p>
                      <p className="text-sm text-muted-foreground mb-4">Started: 15:41</p>
                      <Button onClick={handleCloseShift} className="w-full bg-primary hover:bg-primary/90" size="lg">
                        <Lock className="mr-2 h-5 w-5" />
                        Close Shift
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="h-5 w-5 text-red-500" />
                        <span className="text-lg font-medium text-red-500">CLOSED</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">No active shift</p>
                      <Button onClick={handleOpenShift} className="w-full bg-primary hover:bg-primary/90" size="lg">
                        <LockOpen className="mr-2 h-5 w-5" />
                        Open Shift
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Sales and Expenses Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-2">Today's Sales</p>
                    <p className="text-4xl font-bold">KES6,340</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-2">Today's Expenses</p>
                    <p className="text-4xl font-bold">KES19,917.23</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>

          {/* Close Shift Dialog */}
          <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">Enter Final Balances</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cash" className="flex items-center gap-2">
                    <span className="text-lg">💵</span>
                    Cash Amount (KES)
                  </Label>
                  <Input
                    id="cash"
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="h-12 text-lg bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mpesa" className="flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    MPESA Amount (KES)
                  </Label>
                  <Input
                    id="mpesa"
                    type="number"
                    value={mpesaAmount}
                    onChange={(e) => setMpesaAmount(e.target.value)}
                    className="h-12 text-lg bg-muted"
                  />
                </div>
              </div>
              <DialogFooter className="flex gap-2 sm:gap-2">
                <Button onClick={handleSubmitBalances} className="flex-1 bg-primary hover:bg-primary/90 h-12">
                  <span className="mr-2">💵</span>
                  Submit Balances & Close Shift
                </Button>
                <Button variant="secondary" onClick={() => setShowCloseDialog(false)} className="flex-1 h-12">
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Success Dialog */}
          <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">Success</DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-base leading-relaxed py-4">
                Shift successfully closed with KES {cashAmount} cash and KES {mpesaAmount} MPESA. Reconciliation
                initiated.
              </DialogDescription>
              <DialogFooter>
                <Button onClick={() => setShowSuccessDialog(false)} className="w-full bg-primary hover:bg-primary/90">
                  OK
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  )
}
