"use client"

import { useState } from "react"
import {
  Menu,
  TrendingUp,
  Receipt,
  BarChart3,
  Settings,
  Search,
  Copy,
  Filter,
  Users,
  FileText,
  X,
  Plus,
  Minus,
  Wallet,
  CreditCard,
  Banknote,
  ShoppingCart,
  Moon,
  RefreshCw,
  LogOut,
  User,
  Package,
  Store,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { useItems } from "@/hooks/use-items"
import { useCustomersByShop, useCustomerBalance } from "@/hooks/use-customers"
import { useCreateSale, useSales } from "@/hooks/use-sales"
import { useAppStore } from "@/store/use-app-store"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"
import { ReceiptDialog } from "@/components/sales/receipt-dialog"
import { useExpenses, useCreateExpense } from "@/hooks/use-expenses"
import { CustomerManager } from "@/components/customers/CustomerManager"
import { CustomerPaymentsManager } from "@/components/payments/CustomerPaymentsManager"
import { ShiftPerformanceDialog } from "@/components/reports/ShiftPerformanceDialog"
import { SalesReportDialog } from "@/components/reports/SalesReportDialog"
import { CustomerNetPositionDialog } from "@/components/reports/CustomerNetPositionDialog"
import { Loader2, ChevronLeft } from "lucide-react"

type SaleCategory = "IMMEDIATE" | "CREDIT" | "PREPAID"
type PaymentMethod = "CASH" | "MPESA" | "SPLIT"

// ... ExpenseCategory type remains same ...
type ExpenseCategory =
  | "rent"
  | "utilities"
  | "transport"
  | "salaries"
  | "marketing"
  | "supplies"
  | "insurance"
  | "maintenance"
  | "food-lunch"
  | "general"

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState("sales")
  const [showPOS, setShowPOS] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showShiftReportDialog, setShowShiftReportDialog] = useState(false)
  const [showSalesReportDialog, setShowSalesReportDialog] = useState(false)
  const [showNetPositionDialog, setShowNetPositionDialog] = useState(false)
  const [currentView, setCurrentView] = useState<"main" | "customers" | "payments">("main")

  // Global State
  const activeShop = useAppStore((state) => state.activeShop)
  const activeShift = useAppStore((state) => state.activeShift)
  const userInfo = useAppStore((state) => state.userInfo)

  // Data Fetching Hooks
  const { items, isLoading: itemsLoading } = useItems()
  const { data: customers = [], isLoading: customersLoading } = useCustomersByShop(activeShop?.id)
  const { data: sales, isLoading: salesLoading } = useSales(activeShop?.id)
  const { data: expenses, isLoading: expensesLoading } = useExpenses(activeShop?.id)
  const { mutateAsync: completeSale, isPending: isSubmitting } = useCreateSale()
  const { mutateAsync: createExpense, isPending: isExpenseSubmitting } = useCreateExpense()

  // POS State
  const [saleCategory, setSaleCategory] = useState<SaleCategory>("IMMEDIATE")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH")
  const [cashAmount, setCashAmount] = useState("")
  const [mpesaAmount, setMpesaAmount] = useState("")
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
  const [itemSearchQuery, setItemSearchQuery] = useState("")
  const [cartItems, setCartItems] = useState<any[]>([])

  const { balance: customerBalance } = useCustomerBalance(selectedCustomerId)





  // Expense State
  const [expenseAmount, setExpenseAmount] = useState("0")
  const [expenseReference, setExpenseReference] = useState("")
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("general")
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<"cash" | "mpesa">("cash")

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * (parseFloat(item.quantity) || 0), 0)
  }

  const addToCart = (item: any) => {
    const existing = cartItems.find((ci) => ci.id === item.id)
    if (existing) {
      setCartItems(
        cartItems.map((ci) => (ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci))
      )
    } else {
      setCartItems([...cartItems, { id: item.id, name: item.name, price: item.sale_price, quantity: 1 }])
    }
    toast.success(`${item.name} added to cart`)
  }

  const handleQuantityInputChange = (id: string, value: string) => {
    // Allow empty string so user can clear the input
    if (value === "") {
      setCartItems(
        cartItems.map((item) => (item.id === id ? { ...item, quantity: "" } : item))
      )
      return
    }

    const qty = parseFloat(value)
    if (!isNaN(qty)) {
      setCartItems(
        cartItems.map((item) => (item.id === id ? { ...item, quantity: value } : item))
      )
    }
  }

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(
      cartItems.map((item) => {
        if (item.id === id) {
          const currentQty = parseFloat(item.quantity) || 0
          return { ...item, quantity: Math.max(0, currentQty + delta) }
        }
        return item
      })
    )
  }

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id))
  }

  const handleCashAmountChange = (value: string) => {
    setCashAmount(value)
    const cash = parseFloat(value) || 0
    const total = calculateTotal()
    const remaining = Math.max(0, total - cash)
    setMpesaAmount(remaining.toFixed(2))
  }

  const handleMpesaAmountChange = (value: string) => {
    setMpesaAmount(value)
    const mpesa = parseFloat(value) || 0
    const total = calculateTotal()
    const remaining = Math.max(0, total - mpesa)
    setCashAmount(remaining.toFixed(2))
  }

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method)
    if (method === "SPLIT") {
      const total = calculateTotal()
      // Initial split: 0 Cash, All Mpesa (or vice versa, but let's do 0/All)
      setCashAmount("0")
      setMpesaAmount(total.toFixed(2))
    }
  }

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty")
      return
    }

    if (saleCategory !== "IMMEDIATE" && !selectedCustomerId) {
      toast.error("Please select a customer for Credit/Prepaid sales")
      return
    }

    if (!activeShop || !activeShift) {
      toast.error("Shop or Shift not active")
      return
    }

    const totalAmount = calculateTotal()

    // Validate payments for IMMEDIATE sales
    const payments = []
    if (saleCategory === "IMMEDIATE") {
      if (paymentMethod === "CASH") {
        payments.push({ payment_method: "CASH", amount: totalAmount })
      } else if (paymentMethod === "MPESA") {
        payments.push({ payment_method: "MPESA", amount: totalAmount })
      } else if (paymentMethod === "SPLIT") {
        const cash = parseFloat(cashAmount) || 0
        const mpesa = parseFloat(mpesaAmount) || 0
        if (Math.abs(cash + mpesa - totalAmount) > 0.1) {
          toast.error(`Payment sum (KES ${cash + mpesa}) must match total (KES ${totalAmount})`)
          return
        }
        if (cash > 0) payments.push({ payment_method: "CASH", amount: cash })
        if (mpesa > 0) payments.push({ payment_method: "MPESA", amount: mpesa })
      }
    }

    const finalItems = cartItems.filter((item) => (parseFloat(item.quantity) || 0) > 0)
    if (finalItems.length === 0) {
      toast.error("Cart contains no items with valid quantity")
      return
    }

    const payload = {
      sale: {
        id: uuidv4(),
        shop_id: activeShop.id,
        shift_id: activeShift.id,
        customer_id: selectedCustomerId || null,
        total_amount: totalAmount,
        sale_category: saleCategory,
        sale_date: new Date().toISOString(),
        created_by: userInfo?.id || "system",
      },
      items: finalItems.map((item) => ({
        id: uuidv4(),
        item_id: item.id,
        quantity: parseFloat(item.quantity) || 0,
        unit_price: item.price,
        total_price: item.price * (parseFloat(item.quantity) || 0),
        created_by: userInfo?.id || "system",
      })),
      payments: payments.map((p) => ({
        ...p,
        id: uuidv4(),
        shift_id: activeShift.id,
        created_by: userInfo?.id || "system",
      })),
    }

    try {
      await completeSale(payload)
      setCartItems([])
      setSelectedCustomerId("")
      setShowPOS(false)
      setCashAmount("")
      setMpesaAmount("")
    } catch (error) {
      console.error("Sale failed:", error)
    }
  }

  if (currentView === "customers") {
    return (
      <div className="flex min-h-screen bg-muted/40 text-foreground transition-colors duration-300">
        <div className="hidden md:block w-80 border-r border-border bg-card sticky top-0 h-screen overflow-y-auto">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <CustomerManager onBack={() => setCurrentView("main")} />
        </div>
      </div>
    )
  }

  if (currentView === "payments") {
    return (
      <div className="flex min-h-screen bg-muted/40 text-foreground transition-colors duration-300">
        <div className="hidden md:block w-80 border-r border-border bg-card sticky top-0 h-screen overflow-y-auto">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <CustomerPaymentsManager onBack={() => setCurrentView("main")} />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex min-h-screen bg-muted/40 text-foreground transition-colors duration-300">
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
            <h1 className="text-xl font-bold tracking-tight">Sales and Expenses</h1>
          </header>

          {/* Desktop Header */}
          <header className="hidden md:flex items-center h-[64px] px-6 bg-card border-b border-border/50 sticky top-0 z-30">
            <div className="pl-[44px]">
              <h1 className="text-xl font-bold tracking-tight">Sales and Expenses</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-8 lg:p-12 w-full mx-auto overflow-y-auto">
            <div className="max-w-[1440px] mx-auto h-[calc(100vh-8rem)]">
              <Card className="h-full border-none shadow-sm flex flex-col bg-card overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                  {/* Tab Navigation */}
                  <div className="border-b px-6 flex-shrink-0">
                    <TabsList className="flex h-auto w-full justify-start gap-8 bg-transparent p-0 overflow-x-auto scrollbar-hide whitespace-nowrap">
                      <TabsTrigger
                        value="sales"
                        className="relative h-14 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary"
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          <span>Sales</span>
                        </div>
                      </TabsTrigger>
                      <TabsTrigger
                        value="expenses"
                        className="relative h-14 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary"
                      >
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          <span>Expenses</span>
                        </div>
                      </TabsTrigger>
                      <TabsTrigger
                        value="reports"
                        className="relative h-14 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary"
                      >
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          <span>Reports</span>
                        </div>
                      </TabsTrigger>
                      <TabsTrigger
                        value="more"
                        className="relative h-14 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span>More</span>
                        </div>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-0">

                    {/* Sales Tab */}
                    <TabsContent value="sales" className="h-full p-6 space-y-6">
                      <Button onClick={() => setShowPOS(true)} className="w-full bg-primary hover:bg-primary/90 h-14 text-base">
                        <Plus className="h-5 w-5 mr-2" />
                        New Sale
                      </Button>

                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Recent Sales</h2>
                        <Button variant="outline" size="icon">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="overflow-x-auto pb-4">
                        <div className="border rounded-lg min-w-[600px]">
                          <div className="grid grid-cols-4 p-4 border-b bg-muted/40 font-medium text-sm text-muted-foreground">
                            <div>Sale ID</div>
                            <div>Date</div>
                            <div>Type</div>
                            <div className="text-right">Amount</div>
                          </div>
                          <div className="divide-y">
                            {salesLoading ? (
                              <div className="p-8 text-center text-muted-foreground">Loading sales...</div>
                            ) : sales?.length === 0 ? (
                              <div className="p-8 text-center text-muted-foreground">No recent sales</div>
                            ) : (
                              sales?.map((sale: any) => (
                                <div
                                  key={sale.id}
                                  className="grid grid-cols-4 p-4 items-center hover:bg-muted/50 transition-colors cursor-pointer text-sm"
                                  onClick={() => setSelectedSaleId(sale.id)}
                                >
                                  <div className="font-medium text-primary" title={sale.id}>#{sale.id.slice(0, 8)}</div>
                                  <div className="text-muted-foreground">
                                    {new Date(sale.sale_date).toLocaleString('en-US', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: 'numeric',
                                      minute: 'numeric',
                                      hour12: true
                                    })}
                                  </div>
                                  <div>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary transition-colors">
                                      {sale.sale_category}
                                    </span>
                                  </div>
                                  <div className="text-right font-bold">KES {sale.total_amount.toLocaleString()}</div>
                                </div>
                              )))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Expenses Tab */}
                    <TabsContent value="expenses" className="h-full p-6 space-y-6">
                      <Button
                        onClick={() => setShowExpenseDialog(true)}
                        className="w-full h-14 text-base bg-[oklch(0.5_0.15_20)] hover:bg-[oklch(0.45_0.15_20)]"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Expense
                      </Button>

                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Recent Expenses</h2>
                        <Button variant="outline" size="icon">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="overflow-x-auto pb-4">
                        <div className="border rounded-lg overflow-hidden min-w-[600px]">
                          <div className="grid grid-cols-4 p-4 border-b bg-muted/40 font-medium text-sm text-muted-foreground">
                            <div>Category</div>
                            <div>Description</div>
                            <div>Date</div>
                            <div className="text-right">Amount</div>
                          </div>
                          <div className="divide-y max-h-[500px] overflow-y-auto">
                            {expensesLoading ? (
                              <div className="p-8 text-center text-muted-foreground">Loading expenses...</div>
                            ) : expenses?.length === 0 ? (
                              <div className="p-12 text-center border-2 border-dashed rounded-lg bg-muted/5 m-4">
                                <div className="bg-muted/20 p-4 rounded-full mb-4 inline-block">
                                  <Receipt className="h-10 w-10 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-lg font-semibold">No expenses recorded</h3>
                                <p className="text-muted-foreground text-sm max-w-sm mt-2 mb-6 mx-auto">
                                  Expenses recorded for this branch will appear here.
                                </p>
                                <Button variant="outline" onClick={() => setShowExpenseDialog(true)}>
                                  Record First Expense
                                </Button>
                              </div>
                            ) : (
                              expenses?.map((expense: any) => (
                                <div key={expense.id} className="grid grid-cols-4 p-4 items-center hover:bg-muted/50 transition-colors cursor-pointer text-sm">
                                  <div className="font-medium text-primary">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 uppercase">
                                      {expense.category}
                                    </span>
                                  </div>
                                  <div className="truncate text-muted-foreground pr-4" title={expense.description || ""}>
                                    {expense.description || "No description"}
                                  </div>
                                  <div className="text-muted-foreground/80">
                                    {new Date(expense.expense_date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: '2-digit'
                                    })}
                                  </div>
                                  <div className="text-right font-bold text-orange-600">KES {expense.amount.toLocaleString()}</div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Reports Tab */}
                    <TabsContent value="reports" className="h-full p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card
                          className="border hover:border-primary/50 transition-colors cursor-pointer group"
                          onClick={() => setShowShiftReportDialog(true)}
                        >
                          <CardContent className="p-6 flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg mb-1">Shift Performance</h3>
                              <p className="text-sm text-muted-foreground">View detailed analytics about current and past shifts.</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card
                          className="border hover:border-primary/50 transition-colors cursor-pointer group"
                          onClick={() => setShowSalesReportDialog(true)}
                        >
                          <CardContent className="p-6 flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <BarChart3 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg mb-1">Sales Report</h3>
                              <p className="text-sm text-muted-foreground">Detailed report of sales transactions.</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card
                          className="border hover:border-primary/50 transition-colors cursor-pointer group"
                          onClick={() => setShowNetPositionDialog(true)}
                        >
                          <CardContent className="p-6 flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg mb-1">Customer Net Position</h3>
                              <p className="text-sm text-muted-foreground">Detailed history of customer account activity and balances.</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    {/* More Tab */}
                    <TabsContent value="more" className="h-full p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card
                          className="border hover:border-primary/50 transition-colors cursor-pointer group"
                          onClick={() => setCurrentView("customers")}
                        >
                          <CardContent className="p-6 flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg mb-1">Customers</h3>
                              <p className="text-sm text-muted-foreground">Manage customer profiles and credit history.</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card
                          className="border hover:border-primary/50 transition-colors cursor-pointer group"
                          onClick={() => setCurrentView("payments")}
                        >
                          <CardContent className="p-6 flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <CreditCard className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg mb-1">Payments</h3>
                              <p className="text-sm text-muted-foreground">View payment history and transaction details.</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </Card>

              <ShiftPerformanceDialog
                open={showShiftReportDialog}
                onOpenChange={setShowShiftReportDialog}
              />

              <SalesReportDialog
                open={showSalesReportDialog}
                onOpenChange={setShowSalesReportDialog}
              />

              <CustomerNetPositionDialog
                open={showNetPositionDialog}
                onOpenChange={setShowNetPositionDialog}
              />
            </div>
          </main >

          {/* Point of Sale Dialog */}
          < Sheet open={showPOS} onOpenChange={setShowPOS} >
            <SheetContent
              side="bottom"
              className="h-[100vh] w-full p-0 gap-0 overflow-hidden flex flex-col max-w-none"
            >
              {/* Header */}
              <div className="sticky top-0 bg-card z-10 border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <h2 className="text-2xl font-bold">Point of Sale</h2>
                    <p className="text-sm text-muted-foreground">
                      Branch: <span className="font-medium">{activeShop?.name || "None"}</span> •
                      Shift: <span className="font-medium">#{activeShift?.id?.slice(-4) || "None"}</span>
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowPOS(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto min-h-0 bg-muted/30">
                <div className="p-4 md:p-8 lg:p-12 space-y-6">
                  <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Configuration & Search (7 cols) */}
                    <div className="lg:col-span-8 space-y-6">

                      {/* Customer & Category Selection */}
                      <Card className="shadow-sm">
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Sale Category */}
                          <div>
                            <Label className="text-sm font-bold mb-3 block text-primary uppercase tracking-wider">1. Sale Type</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {["IMMEDIATE", "CREDIT", "PREPAID"].map((cat) => (
                                <Button
                                  key={cat}
                                  variant={saleCategory === cat ? "default" : "outline"}
                                  className="h-16 flex flex-col gap-1 transition-all"
                                  onClick={() => setSaleCategory(cat as SaleCategory)}
                                >
                                  {cat === "IMMEDIATE" && <Banknote className="h-5 w-5" />}
                                  {cat === "CREDIT" && <CreditCard className="h-5 w-5" />}
                                  {cat === "PREPAID" && <Wallet className="h-5 w-5" />}
                                  <span className="text-xs font-bold uppercase">{cat}</span>
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Customer Selection */}
                          <div>
                            <Label className="text-sm font-bold mb-3 block text-primary uppercase tracking-wider">
                              2. Customer {saleCategory !== "IMMEDIATE" && <span className="text-destructive">*</span>}
                            </Label>
                            {customersLoading ? (
                              <div className="h-14 flex items-center justify-center border rounded-md bg-muted/20">
                                <Loader2 className="h-5 w-5 animate-spin" />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <select
                                  value={selectedCustomerId}
                                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                                  className="flex h-16 w-full rounded-md border border-input bg-card px-4 py-2 text-lg ring-offset-background focus:ring-2 focus:ring-primary outline-none transition-all"
                                >
                                  <option value="">Walk-in Customer</option>
                                  {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name} {c.phone ? `(${c.phone})` : ""}
                                    </option>
                                  ))}
                                </select>
                                {selectedCustomerId && (
                                  <div className="flex items-center justify-between px-2 text-sm">
                                    <span className="text-muted-foreground font-medium">Available Balance:</span>
                                    <span className={`font-bold ${customerBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                                      KES {customerBalance.toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Payment Method (Only for IMMEDIATE) */}
                      {saleCategory === "IMMEDIATE" && (
                        <Card className="shadow-sm border-l-4 border-l-primary">
                          <CardContent className="p-6 space-y-6">
                            <div>
                              <Label className="text-sm font-bold mb-3 block text-primary uppercase tracking-wider">3. Payment Configuration</Label>
                              <div className="grid grid-cols-3 gap-3">
                                {["CASH", "MPESA", "SPLIT"].map((method) => (
                                  <Button
                                    key={method}
                                    variant={paymentMethod === method ? "default" : "outline"}
                                    className={`h-16 flex flex-col gap-1 ${paymentMethod === method ? "bg-primary hover:bg-primary/90" : ""}`}
                                    onClick={() => handlePaymentMethodChange(method as PaymentMethod)}
                                  >
                                    <span className="text-xs font-bold opacity-70 uppercase">{method}</span>
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {paymentMethod === "SPLIT" && (
                              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold text-muted-foreground uppercase">Cash Amount</Label>
                                  <div className="relative">
                                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      placeholder="0.00"
                                      value={cashAmount}
                                      onChange={(e) => handleCashAmountChange(e.target.value)}
                                      className="h-12 pl-10 text-lg font-bold"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold text-muted-foreground uppercase">M-Pesa Amount</Label>
                                  <div className="relative">
                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      placeholder="0.00"
                                      value={mpesaAmount}
                                      onChange={(e) => handleMpesaAmountChange(e.target.value)}
                                      className="h-12 pl-10 text-lg font-bold"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Product Search & Catalog */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            <Plus className="h-6 w-6 text-primary" />
                            Select Products
                          </h3>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="Enter product name or SKU..."
                            className="pl-12 h-16 text-lg bg-card border-border shadow-sm focus:ring-2 focus:ring-primary"
                            value={itemSearchQuery}
                            onChange={(e) => setItemSearchQuery(e.target.value)}
                          />
                        </div>

                        {/* Search Results Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[400px] pr-2">
                          {itemsLoading ? (
                            Array(6).fill(0).map((_, i) => (
                              <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-xl" />
                            ))
                          ) : items.filter(i =>
                            i.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                            i.id.includes(itemSearchQuery)
                          ).map((item) => (
                            <Card
                              key={item.id}
                              className="group cursor-pointer hover:border-primary hover:shadow-md transition-all active:scale-95 overflow-hidden border border-border/50 bg-card"
                              onClick={() => addToCart(item)}
                            >
                              <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                                <div>
                                  <div className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{item.name}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="text-[10px] text-muted-foreground bg-muted-foreground/10 px-1.5 py-0.5 rounded uppercase font-black tracking-tight">
                                      {item.unit_of_measure}
                                    </div>
                                    <div className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase font-black tracking-tight">
                                      Stock: {item.quantity}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-end justify-between pt-2">
                                  <div className="text-primary font-black text-xl leading-none">
                                    <span className="text-xs font-bold mr-0.5">KES</span>
                                    {item.sale_price.toLocaleString()}
                                  </div>
                                  <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Plus className="h-5 w-5" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Cart & Summary (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                      <Card className="flex flex-col h-[calc(100vh-16rem)] shadow-lg border-primary/20 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-6 flex flex-col h-full">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-black flex items-center gap-2">
                              <ShoppingCart className="h-7 w-7 text-primary" />
                              Cart
                              <span className="bg-primary text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center ml-1">
                                {cartItems.length}
                              </span>
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-muted-foreground font-bold hover:text-red-500"
                              onClick={() => setCartItems([])}
                            >
                              CLEAR
                            </Button>
                          </div>

                          {/* Cart Item List */}
                          <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2 space-y-4">
                            {cartItems.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                                <ShoppingCart className="h-16 w-16 mb-4" />
                                <p className="font-bold text-lg">Your cart is empty</p>
                                <p className="text-sm">Add items from the catalog on the left to start a sale</p>
                              </div>
                            ) : cartItems.map((item) => (
                              <div key={item.id} className="p-4 rounded-2xl border border-border bg-card group shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="font-bold text-lg line-clamp-1">{item.name}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                    onClick={() => removeItem(item.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-1 bg-muted/30 rounded-xl p-1 shadow-inner border">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-10 w-10 text-primary hover:bg-white transition-all shadow-none"
                                      onClick={() => updateQuantity(item.id, -1)}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <Input
                                      type="number"
                                      step="any"
                                      value={item.quantity}
                                      onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                                      className="w-16 h-10 border-none bg-transparent text-center font-black text-lg focus-visible:ring-0 p-0"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-10 w-10 text-primary hover:bg-white transition-all shadow-none"
                                      onClick={() => updateQuantity(item.id, 1)}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs font-bold text-muted-foreground/60 uppercase">
                                      {item.quantity} x {item.price.toLocaleString()}
                                    </div>
                                    <div className="text-xl font-black text-primary tracking-tighter">
                                      KES {(item.price * (parseFloat(item.quantity) || 0)).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Order Summary Footer */}
                          <div className="mt-8 pt-8 border-t-2 border-dashed space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-muted-foreground font-bold">
                                <span>SUBTOTAL</span>
                                <span>KES {calculateTotal().toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-muted-foreground font-bold">
                                <span>TAX (VAT 0%)</span>
                                <span>KES 0.00</span>
                              </div>
                            </div>
                            <div className="bg-primary/5 p-4 rounded-2xl flex justify-between items-center">
                              <span className="text-lg font-bold text-primary">GRAND TOTAL</span>
                              <span className="text-3xl font-black text-primary tracking-tighter">
                                KES {calculateTotal().toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Button
                        disabled={isSubmitting || cartItems.length === 0}
                        onClick={handleCompleteSale}
                        className="w-full h-24 text-2xl font-black rounded-3xl shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 group overflow-hidden relative"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            PROCESSING...
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full px-4">
                            <span>COMPLETE SALE</span>
                            <div className="bg-white/20 p-3 rounded-full group-hover:translate-x-2 transition-transform">
                              <TrendingUp className="h-8 w-8" />
                            </div>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet >

          {/* Receipt Dialog */}
          < ReceiptDialog
            open={!!selectedSaleId
            }
            onOpenChange={(open) => !open && setSelectedSaleId(null)}
            saleId={selectedSaleId || ""}
          />


          {/* Add Expense Sheet (Bottom Sheet UI) */}
          <Sheet open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
            <SheetContent side="bottom" className="h-screen w-screen p-0 flex flex-col overflow-hidden border-none">
              <SheetHeader className="px-6 py-6 border-b flex-shrink-0 flex flex-row items-center justify-between">
                <div>
                  <SheetTitle className="text-3xl font-black tracking-tighter">RECORD EXPENSE</SheetTitle>
                  <p className="text-sm text-muted-foreground">
                    Branch: <span className="font-bold">{activeShop?.name}</span>
                  </p>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-muted/20">
                <div className="max-w-2xl mx-auto space-y-8 pb-12">
                  {/* Amount Section */}
                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-primary uppercase tracking-widest">1. Amount (KES) *</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-muted-foreground">KES</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="h-20 pl-20 text-4xl font-black bg-card border-2 focus:border-primary transition-all rounded-2xl"
                      />
                    </div>
                  </div>

                  {/* Category Section */}
                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-primary uppercase tracking-widest">2. Category *</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        'Rent', 'Utilities', 'Transport', 'Salaries',
                        'Marketing', 'Supplies', 'Insurance', 'Maintenance',
                        'Food/Lunch', 'General'
                      ].map((cat) => (
                        <Button
                          key={cat}
                          variant={expenseCategory === cat.toLowerCase().replace('/', '-') ? "default" : "outline"}
                          className={`h-14 font-bold border-2 transition-all rounded-xl ${expenseCategory === cat.toLowerCase().replace('/', '-') ? "scale-105 shadow-md" : "hover:bg-primary/5"
                            }`}
                          onClick={() => setExpenseCategory(cat.toLowerCase().replace('/', '-') as ExpenseCategory)}
                        >
                          {cat}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-primary uppercase tracking-widest">3. Payment Method *</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant={expensePaymentMethod === 'cash' ? "default" : "outline"}
                        className="h-16 text-lg font-black gap-2 rounded-2xl border-2"
                        onClick={() => setExpensePaymentMethod('cash')}
                      >
                        <Banknote className="h-6 w-6" />
                        CASH
                      </Button>
                      <Button
                        variant={expensePaymentMethod === 'mpesa' ? "default" : "outline"}
                        className="h-16 text-lg font-black gap-2 rounded-2xl border-2"
                        onClick={() => setExpensePaymentMethod('mpesa')}
                      >
                        <Store className="h-6 w-6" />
                        M-PESA
                      </Button>
                    </div>
                  </div>

                  {/* Description & Reference */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-sm font-bold text-primary uppercase tracking-widest">4. Description *</Label>
                      <Input
                        placeholder="What was this for?"
                        value={expenseReference}
                        onChange={(e) => setExpenseReference(e.target.value)}
                        className="h-14 bg-card border-2 rounded-xl px-4"
                      />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-sm font-bold text-primary uppercase tracking-widest">5. Notes (Optional)</Label>
                      <Input
                        placeholder="Add more details..."
                        className="h-14 bg-card border-2 rounded-xl px-4"
                      />
                    </div>
                  </div>

                  <Button
                    disabled={isExpenseSubmitting || !expenseAmount || parseFloat(expenseAmount) <= 0 || !expenseReference}
                    onClick={async () => {
                      if (!activeShop || !activeShift || !userInfo) {
                        toast.error("Required context missing (Shop/Shift/User)")
                        return
                      }

                      try {
                        await createExpense({
                          shop_id: activeShop.id,
                          shift_id: activeShift.id,
                          expense_date: new Date().toISOString(),
                          amount: parseFloat(expenseAmount),
                          description: expenseReference,
                          category: expenseCategory.toUpperCase(),
                          payment_method: expensePaymentMethod.toUpperCase() as 'CASH' | 'MPESA',
                          created_by: userInfo.id,
                        })
                        setShowExpenseDialog(false)
                        setExpenseAmount("0")
                        setExpenseReference("")
                      } catch (err) {
                        console.error(err)
                      }
                    }}
                    className="w-full h-20 text-2xl font-black rounded-3xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {isExpenseSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        RECORDING...
                      </div>
                    ) : (
                      "SAVE EXPENSE"
                    )}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div >
      </div >
    </>
  )
}
