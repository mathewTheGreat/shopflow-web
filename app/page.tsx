"use client"

import { useState, useEffect, useMemo } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { apiClient } from "@/lib/api-client"
import { shiftService } from "@/services/shift.service"
import { toast } from "sonner"
import {
  Menu,
  ShoppingCart,
  Package,
  Store,
  RefreshCw,
  LogOut,
  User as UserIcon,
  Loader2,
  AlertTriangle,
  TrendingDown,
  Search,
  Filter,
} from "lucide-react"

// Hooks
import { useShift } from "@/hooks/use-shift"
import { useAppStore } from "@/store/use-app-store"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { useStockLevelsByShop } from "@/hooks/use-stock-levels"
import { useItems } from "@/hooks/use-items"

// Components
import { ShiftStatusCard } from "@/components/shifts/ShiftStatusCard"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  const { currentShift, isLoading: isLoadingShift, openShift, closeShift, isOpening, isClosing, expectedFinancials } = useShift()
  const { sales, expenses, isLoading: isLoadingStats, isManager, currency } = useDashboardStats()
  const { items = [], isLoading: isLoadingItems } = useItems()
  const { data: stockLevels = [], isLoading: isLoadingStock } = useStockLevelsByShop(activeShop?.id || "")

  const [showOpenDialog, setShowOpenDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [itemSearchQuery, setItemSearchQuery] = useState("")

  // Amounts for dialogs
  const [cashAmount, setCashAmount] = useState("0")
  const [mpesaAmount, setMpesaAmount] = useState("0")

  const shiftOpen = !!(currentShift && !currentShift.is_closed)
  const isCashier = activeShop?.role === "Cashier"

  // Create highly efficient lookup map for stock levels
  const stockLevelMap = useMemo(() => {
    const map: Record<string, number> = {}
    stockLevels.forEach(level => {
      map[level.item_id] = level.quantity
    })
    return map
  }, [stockLevels])

  // Process and filter items for the inventory list
  const filteredInventoryItems = useMemo(() => {
    if (!isCashier) return []

    return items
      .filter(item =>
        item.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
      )
      .map(item => ({
        ...item,
        currentQuantity: stockLevelMap[item.id] ?? 0
      }))
      .sort((a, b) => {
        // Sort by out of stock/low stock first
        if (a.currentQuantity <= 0 && b.currentQuantity > 0) return -1
        if (a.currentQuantity > 0 && b.currentQuantity <= 0) return 1
        return a.name.localeCompare(b.name)
      })
  }, [items, stockLevelMap, itemSearchQuery, isCashier])

  const handleOpenShiftClick = async () => {
    if (!activeShop) {
      toast.error("No shop selected")
      return
    }

    try {
      const activeShift = await shiftService.getActiveShift(activeShop.id)
      if (activeShift) {
        toast.error("A shift is already active in this shop. Please close it before opening a new one.")
        return
      }
    } catch (error) {
      console.error("Failed to check active shift:", error)
    }

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
        <main className="flex-1 p-4 md:p-8 lg:p-12 w-full mx-auto overflow-y-auto scrollbar-hide">
          <div className="max-w-[1440px] mx-auto space-y-8">
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

            {/* Real-time Inventory Section - For Cashiers */}
            {isCashier && (
              <Card className="bg-card border-none shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                <CardContent className="p-0">
                  <div className="p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold tracking-tight uppercase">Stock Balances</h3>
                    </div>

                    <div className="relative flex-1 max-w-md group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        placeholder="Search items by name..."
                        className="pl-10 h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                      {/* Grid Header */}
                      <div className="grid grid-cols-12 px-6 py-4 bg-muted/20 font-black text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border/30">
                        <div className="col-span-6">Item Name</div>
                        <div className="col-span-3 text-center">Status</div>
                        <div className="col-span-3 text-right pr-4">Current Stock</div>
                      </div>

                      <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto scrollbar-hide">
                        {isLoadingItems || isLoadingStock ? (
                          <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary/40" />
                            <p className="text-sm font-medium">Checking stock levels...</p>
                          </div>
                        ) : filteredInventoryItems.length === 0 ? (
                          <div className="p-12 text-center text-muted-foreground">
                            <Package className="h-10 w-10 mx-auto mb-4 opacity-10" />
                            <p className="text-sm font-medium">No items found matching your search</p>
                          </div>
                        ) : (
                          filteredInventoryItems.map((item) => {
                            const isLow = item.currentQuantity > 0 && item.currentQuantity <= 10;
                            const isOut = item.currentQuantity <= 0;

                            return (
                              <div key={item.id} className="grid grid-cols-12 px-6 py-5 items-center hover:bg-muted/30 transition-all group">
                                <div className="col-span-6">
                                  <p className="font-black text-lg tracking-tight group-hover:text-primary transition-colors">{item.name}</p>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.unit_of_measure}</p>
                                </div>

                                <div className="col-span-3 flex justify-center">
                                  {isOut ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black rounded-full uppercase tracking-tighter ring-1 ring-red-500/20">
                                      <AlertTriangle className="h-3 w-3" />
                                      Out of Stock
                                    </span>
                                  ) : isLow ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-black rounded-full uppercase tracking-tighter ring-1 ring-orange-500/20">
                                      <TrendingDown className="h-3 w-3" />
                                      Low Stock
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-tighter ring-1 ring-primary/20">
                                      Optimal
                                    </span>
                                  )}
                                </div>

                                <div className="col-span-3 text-right pr-4">
                                  <div className="flex flex-col items-end">
                                    <span className={`text-2xl font-black tracking-tighter ${isOut ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-foreground'}`}>
                                      {item.currentQuantity.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
                                      {item.unit_of_measure}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
            expectedCash={expectedFinancials?.totalExpectedCash ?? 0}
            expectedMpesa={expectedFinancials?.totalExpectedMpesa ?? 0}
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
