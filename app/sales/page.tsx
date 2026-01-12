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

type SaleCategory = "immediate" | "credit" | "prepaid"
type PaymentMethod = "cash" | "mpesa" | "split"
type ExpenseCategory =
  | "rent"
  | "utilities"
  | "transport"
  | "salaries"
  | "marketing"
  | "supplies"
  | "insurance"
  | "maintenance"
  | "food"
  | "general"

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState("sales")
  const [showPOS, setShowPOS] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)

  // POS State
  const [saleCategory, setSaleCategory] = useState<SaleCategory>("immediate")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [cashAmount, setCashAmount] = useState("10.00")
  const [cartItems, setCartItems] = useState([{ id: 1, name: "0.5L Bottle", price: 10, quantity: 1 }])

  // Expense State
  const [expenseAmount, setExpenseAmount] = useState("0")
  const [expenseReference, setExpenseReference] = useState("")
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("general")
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<"cash" | "mpesa">("cash")

  const salesData = [
    { id: "c5bbb2", type: "IMMEDIATE", amount: "630.00", date: "Fri, 31 Oct 2025" },
    { id: "e85860", type: "IMMEDIATE", amount: "210.00", date: "Fri, 31 Oct 2025" },
    { id: "28945d", type: "IMMEDIATE", amount: "140.00", date: "Fri, 31 Oct 2025" },
    { id: "100856", type: "IMMEDIATE", amount: "70.00", date: "Fri, 31 Oct 2025" },
    { id: "30b3c2", type: "IMMEDIATE", amount: "105.00", date: "Fri, 31 Oct 2025" },
    { id: "4c151c", type: "IMMEDIATE", amount: "95.00", date: "Fri, 31 Oct 2025" },
  ]



  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(
      cartItems.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)),
    )
  }

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter((item) => item.id !== id))
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
          <header className="border-b border-border bg-card sticky top-0 z-40">
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
                <h1 className="text-2xl font-medium text-muted-foreground">Sales and Expenses</h1>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto p-4 md:p-6 max-w-7xl">

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tab Navigation */}
              <TabsList className="grid w-full grid-cols-4 h-auto mb-6 bg-transparent">
                <TabsTrigger
                  value="sales"
                  className="flex flex-col items-center gap-1 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-sm">Sales</span>
                </TabsTrigger>
                <TabsTrigger
                  value="expenses"
                  className="flex flex-col items-center gap-1 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Receipt className="h-6 w-6" />
                  <span className="text-sm">Expenses</span>
                </TabsTrigger>
                <TabsTrigger
                  value="reports"
                  className="flex flex-col items-center gap-1 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <BarChart3 className="h-6 w-6" />
                  <span className="text-sm">Reports</span>
                </TabsTrigger>
                <TabsTrigger
                  value="more"
                  className="flex flex-col items-center gap-1 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Settings className="h-6 w-6" />
                  <span className="text-sm">More</span>
                </TabsTrigger>
              </TabsList>

              {/* Sales Tab */}
              <TabsContent value="sales" className="space-y-4">
                <Button onClick={() => setShowPOS(true)} className="w-full bg-primary hover:bg-primary/90 h-14 text-base">
                  New Sale
                </Button>

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Recent Sales</h2>
                  <Button variant="ghost" size="icon">
                    <Filter className="h-5 w-5" />
                  </Button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input placeholder="Search sales..." className="pl-10 h-12 bg-muted border-0" />
                </div>

                <div className="space-y-3">
                  {salesData.map((sale) => (
                    <Card key={sale.id} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Sale #{sale.id}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <span className="text-sm text-muted-foreground">{sale.date}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{sale.type}</span>
                          <span className="text-2xl font-bold">KES {sale.amount}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Expenses Tab */}
              <TabsContent value="expenses" className="space-y-4">
                <Button
                  onClick={() => setShowExpenseDialog(true)}
                  className="w-full h-14 text-base bg-[oklch(0.5_0.15_20)] hover:bg-[oklch(0.45_0.15_20)]"
                >
                  Add Expense
                </Button>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input placeholder="Search expenses..." className="pl-10 h-12 bg-muted border-0" />
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Expenses (0)</h2>
                  <Button variant="ghost" size="icon">
                    <Filter className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Receipt className="h-24 w-24 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground text-lg">No expenses for this shift yet</p>
                </div>
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="space-y-4">
                <Card className="bg-card border-border hover:bg-accent transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-primary" />
                      <span className="text-lg font-medium">Shift Performance</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border hover:bg-accent transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-primary" />
                      <span className="text-lg font-medium">Financial Breakdown</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* More Tab */}
              <TabsContent value="more" className="space-y-4">
                <Card className="bg-card border-border hover:bg-accent transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Users className="h-8 w-8 text-primary" />
                      <span className="text-lg font-medium">Customers</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border hover:bg-accent transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Receipt className="h-8 w-8 text-primary" />
                      <span className="text-lg font-medium">Payments</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>

          {/* Point of Sale Dialog */}
          <Dialog open={showPOS} onOpenChange={setShowPOS}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
              <div className="sticky top-0 bg-card z-10 border-b border-border p-6 flex items-center justify-between">
                <DialogTitle className="text-2xl">Point of Sale</DialogTitle>
                <Button variant="ghost" onClick={() => setShowPOS(false)}>
                  Cancel
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Sale Category */}
                <div>
                  <Label className="text-base mb-3 block">Sale Category</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={saleCategory === "immediate" ? "default" : "outline"}
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setSaleCategory("immediate")}
                    >
                      <Banknote className="h-6 w-6" />
                      <span>Immediate</span>
                    </Button>
                    <Button
                      variant={saleCategory === "credit" ? "default" : "outline"}
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setSaleCategory("credit")}
                    >
                      <CreditCard className="h-6 w-6" />
                      <span>Credit</span>
                    </Button>
                    <Button
                      variant={saleCategory === "prepaid" ? "default" : "outline"}
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setSaleCategory("prepaid")}
                    >
                      <Wallet className="h-6 w-6" />
                      <span>Prepaid</span>
                    </Button>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <Label className="text-base mb-3 block">Payment Method</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={paymentMethod === "cash" ? "default" : "outline"}
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setPaymentMethod("cash")}
                    >
                      <Banknote className="h-6 w-6" />
                      <span>Cash</span>
                    </Button>
                    <Button
                      variant={paymentMethod === "mpesa" ? "default" : "outline"}
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setPaymentMethod("mpesa")}
                    >
                      <CreditCard className="h-6 w-6" />
                      <span>M-Pesa</span>
                    </Button>
                    <Button
                      variant={paymentMethod === "split" ? "default" : "outline"}
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setPaymentMethod("split")}
                    >
                      <Wallet className="h-6 w-6" />
                      <span>Split</span>
                    </Button>
                  </div>
                </div>

                {/* Cash Amount */}
                <div>
                  <Label htmlFor="cashAmount" className="text-base mb-3 block">
                    Cash Amount
                  </Label>
                  <Input
                    id="cashAmount"
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="h-14 text-lg bg-muted"
                  />
                </div>

                {/* Payment Summary */}
                <Card className="bg-muted border-l-4 border-l-teal-500">
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <p className="text-lg">
                        <span className="font-semibold">Total:</span> KSh {calculateTotal().toFixed(2)}
                      </p>
                      <p className="text-lg">
                        <span className="font-semibold">Paid:</span> KSh {cashAmount}
                      </p>
                      <p className="text-lg font-semibold text-teal-500">Fully Paid</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Search Products */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input placeholder="Search products..." className="pl-10 h-12 bg-muted border-0" />
                </div>

                {/* Cart */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Cart ({cartItems.length})</h3>
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <Card key={item.id} className="bg-card border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-lg">{item.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-500"
                              onClick={() => removeItem(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="text-xl font-medium w-12 text-center">{item.quantity}</span>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <span className="text-xl font-bold text-primary">KSh {item.price * item.quantity}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Complete Sale Button */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-border sticky bottom-0 bg-card pb-4">
                  <div className="text-2xl font-bold">Total: KSh {calculateTotal()}</div>
                  <Button className="bg-primary hover:bg-primary/90 h-14 px-8 text-lg">Complete Sale</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Expense Dialog */}
          <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl">Add New Expense</DialogTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowExpenseDialog(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6 pt-4">
                {/* Amount */}
                <div>
                  <Label htmlFor="expenseAmount" className="text-base mb-3 block">
                    Amount (Ksh)
                  </Label>
                  <Input
                    id="expenseAmount"
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="h-14 text-lg bg-muted"
                  />
                </div>

                {/* Reference */}
                <div>
                  <Label htmlFor="expenseReference" className="text-base mb-3 block">
                    Reference (Optional)
                  </Label>
                  <Input
                    id="expenseReference"
                    placeholder="Enter reference or additional notes"
                    value={expenseReference}
                    onChange={(e) => setExpenseReference(e.target.value)}
                    className="h-12 bg-muted"
                  />
                </div>

                {/* Category */}
                <div>
                  <Label className="text-base mb-3 block">Category</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "rent", label: "Rent" },
                      { value: "utilities", label: "Utilities" },
                      { value: "transport", label: "Transport" },
                      { value: "salaries", label: "Salaries" },
                      { value: "marketing", label: "Marketing" },
                      { value: "supplies", label: "Supplies" },
                      { value: "insurance", label: "Insurance" },
                      { value: "maintenance", label: "Maintenance" },
                      { value: "food", label: "Food/Lunch" },
                      { value: "general", label: "General" },
                    ].map((cat) => (
                      <Button
                        key={cat.value}
                        variant={expenseCategory === cat.value ? "default" : "outline"}
                        className="h-12"
                        onClick={() => setExpenseCategory(cat.value as ExpenseCategory)}
                      >
                        {cat.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <Label className="text-base mb-3 block">
                    Payment Method <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={expensePaymentMethod === "cash" ? "default" : "outline"}
                      className="h-16 text-lg"
                      onClick={() => setExpensePaymentMethod("cash")}
                    >
                      Cash
                    </Button>
                    <Button
                      variant={expensePaymentMethod === "mpesa" ? "default" : "outline"}
                      className="h-16 text-lg"
                      onClick={() => setExpensePaymentMethod("mpesa")}
                    >
                      M-Pesa
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button variant="secondary" className="h-14 text-base" onClick={() => setShowExpenseDialog(false)}>
                    Cancel
                  </Button>
                  <Button className="h-14 text-base bg-primary hover:bg-primary/90">Add Expense</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  )
}
