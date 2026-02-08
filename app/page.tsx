"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { apiClient } from "@/lib/api-client"
import {
  Menu,
  ShoppingCart,
  Package,
  Store,
  RefreshCw,
  LogOut,
  User as UserIcon,
  Loader2,
} from "lucide-react"

// Hooks
import { useShift } from "@/hooks/use-shift"
import { useAppStore } from "@/store/use-app-store"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"

// Components
import { ShiftStatusCard } from "@/components/shifts/ShiftStatusCard"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

// Lazy load dialogs for performance
const OpenShiftDialog = dynamic(() => import("@/components/shifts/OpenShiftDialog").then(mod => mod.OpenShiftDialog), {
  ssr: false,
  loading: () => <Loader2 className="h-4 w-4 animate-spin" />
})

const CloseShiftDialog = dynamic(() => import("@/components/shifts/CloseShiftDialog").then(mod => mod.CloseShiftDialog), {
  ssr: false,
  loading: () => <Loader2 className="h-4 w-4 animate-spin" />
})

const ShiftSuccessDialog = dynamic(() => import("@/components/shifts/ShiftSuccessDialog").then(mod => mod.ShiftSuccessDialog), {
  ssr: false
})

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const { activeShop, userInfo } = useAppStore()
  const { currentShift, isLoading: isLoadingShift, openShift, closeShift, isOpening, isClosing } = useShift()
  const { sales, expenses, isLoading: isLoadingStats, isManager, currency } = useDashboardStats()
  const [showOpenDialog, setShowOpenDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  // Amounts for dialogs
  const [cashAmount, setCashAmount] = useState("0")
  const [mpesaAmount, setMpesaAmount] = useState("0")

  const shiftOpen = !!(currentShift && !currentShift.is_closed)

  const handleOpenShiftClick = () => {
    setCashAmount("0")
    setMpesaAmount("0")
    setShowOpenDialog(true)
  }

  const handleOpenShiftSubmit = async () => {
    try {
      await openShift({
        cashAmount: parseFloat(cashAmount),
        mpesaAmount: parseFloat(mpesaAmount)
      })
      setShowOpenDialog(false)
    } catch (error) {
      // Handled by mutation toast
    }
  }

  const handleCloseShiftClick = () => {
    setCashAmount("0")
    setMpesaAmount("0")
    setShowCloseDialog(true)
  }

  const handleCloseShiftSubmit = async () => {
    try {
      await closeShift({
        cashAmount: parseFloat(cashAmount),
        mpesaAmount: parseFloat(mpesaAmount)
      })
      setShowCloseDialog(false)
      setShowSuccessDialog(true)
    } catch (error) {
      // Handled by mutation toast
    }
  }

  // Effect for onboarding redirection
  useEffect(() => {
    if (isLoaded && !userInfo && !activeShop) {
      router.push("/onboarding")
    }
  }, [isLoaded, userInfo, activeShop, router])

  if (!isLoaded || isLoadingShift) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 border-r border-border bg-card sticky top-0 h-screen overflow-y-auto">
        <AppSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-card border-b border-border/50 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-4">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 border-r-border bg-card">
              <AppSidebar />
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center h-[64px] px-6 bg-card border-b border-border/50 sticky top-0 z-30">
          <div className="pl-[44px]">
            <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 lg:p-12 w-full mx-auto">
          <div className="max-w-[1440px] mx-auto space-y-8">
            {/* Welcome Section */}
            {/* Welcome Section */}
            <Card className="bg-card border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-4 md:gap-6">
                <div className="p-2 md:p-3 bg-primary/10 rounded-xl flex-shrink-0">
                  <UserIcon className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground whitespace-nowrap">Welcome back,</p>
                    {activeShop?.role && (
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded uppercase tracking-tighter">
                        {activeShop.role}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-3xl font-bold tracking-tight truncate">
                    {userInfo?.name || 'User'}
                  </h2>
                </div>
              </CardContent>
            </Card>

            {/* Dashboard Content Grid */}
            <div className="flex flex-col gap-8">
              {/* Shift Status Card - Full Width */}
              <div className="w-full">
                <ShiftStatusCard
                  shiftOpen={shiftOpen}
                  startTime={currentShift?.start_time}
                  onOpenShift={handleOpenShiftClick}
                  onCloseShift={handleCloseShiftClick}
                />
              </div>

              {/* Stat Cards - Side by Side */}
              <div className="grid grid-cols-2 gap-4 md:gap-8 w-full">
                <Card className="bg-card border-none shadow-sm h-full w-full">
                  <CardContent className="p-6 md:p-10 lg:p-12">
                    <p className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                      {isManager ? "Today's Shop Sales" : "Sales This Shift"}
                    </p>
                    {isLoadingStats ? (
                      <div className="h-12 w-32 bg-muted animate-pulse rounded-lg" />
                    ) : (
                      <h3 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter">
                        {currency}
                        <span>{" " + Number(sales).toLocaleString()}</span>

                      </h3>
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-card border-none shadow-sm h-full w-full">
                  <CardContent className="p-6 md:p-10 lg:p-12">
                    <p className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                      {isManager ? "Today's Shop Expenses" : "Expenses This Shift"}
                    </p>
                    {isLoadingStats ? (
                      <div className="h-12 w-32 bg-muted animate-pulse rounded-lg" />
                    ) : (
                      <h3 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter">
                        {currency}
                        {" " + Number(expenses).toLocaleString()}
                      </h3>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        {/* Dialogs */}
        {showOpenDialog && (
          <OpenShiftDialog
            open={showOpenDialog}
            onOpenChange={setShowOpenDialog}
            cashAmount={cashAmount}
            setCashAmount={setCashAmount}
            mpesaAmount={mpesaAmount}
            setMpesaAmount={setMpesaAmount}
            onSubmit={handleOpenShiftSubmit}
            isLoading={isOpening}
          />
        )}

        {showCloseDialog && (
          <CloseShiftDialog
            open={showCloseDialog}
            onOpenChange={setShowCloseDialog}
            cashAmount={cashAmount}
            setCashAmount={setCashAmount}
            mpesaAmount={mpesaAmount}
            setMpesaAmount={setMpesaAmount}
            onSubmit={handleCloseShiftSubmit}
            isLoading={isClosing}
          />
        )}

        {showSuccessDialog && (
          <ShiftSuccessDialog
            open={showSuccessDialog}
            onOpenChange={setShowSuccessDialog}
            cashAmount={cashAmount}
            mpesaAmount={mpesaAmount}
          />
        )}
      </div>
    </div>
  )
}
