"use client"

import { useState } from "react"
import {
    Package,
    ArrowRightLeft,
    BarChart3,
    Settings,
    Plus,
    Filter,
    Search,
    Menu,
    Edit,
    Trash2,
    ArrowDown,
    ArrowUp,
    ClipboardList,
    Loader2,
    Building2,
    ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppSidebar } from "@/components/app-sidebar"
import { ItemFormDialog } from "@/components/inventory/ItemFormDialog"
import { StockInDialog } from "@/components/inventory/StockInDialog"
import { StockOutDialog } from "@/components/inventory/StockOutDialog"
import { StockTakeDialog } from "@/components/inventory/StockTakeDialog"
import { SupplierManager } from "@/components/inventory/SupplierManager"
import { StockTransactionsGrid } from "@/components/inventory/StockTransactionsGrid"
import { SupplierDeliveryReportDialog } from "@/components/reports/SupplierDeliveryReportDialog"
import { VarianceReportDialog } from "@/components/reports/VarianceReportDialog"
import { useItems } from "@/hooks/use-items"
import { useAppStore } from "@/store/use-app-store"
import { Item } from "@/services/item.service"

export default function InventoryPage() {
    const [activeTab, setActiveTab] = useState("items")
    const [currentView, setCurrentView] = useState<"main" | "suppliers">("main")
    const [showAddItem, setShowAddItem] = useState(false)
    const [showStockInDialog, setShowStockInDialog] = useState(false)
    const [showStockOutDialog, setShowStockOutDialog] = useState(false)

    const [showStockTakeDialog, setShowStockTakeDialog] = useState(false)
    const [showSupplierReportDialog, setShowSupplierReportDialog] = useState(false)
    const [showVarianceReportDialog, setShowVarianceReportDialog] = useState(false)
    const [selectedItem, setSelectedItem] = useState<Item | null>(null)
    const { items, isLoading, refetch } = useItems()
    const currency = useAppStore((state) => state.userCurrency) || "KES"
    const activeShift = useAppStore((state) => state.activeShift)

    const handleEditItem = (item: Item) => {
        setSelectedItem(item)
        setShowAddItem(true)
    }

    const handleCloseDialog = () => {
        setShowAddItem(false)
        setSelectedItem(null)
    }

    const handleSuccess = () => {
        refetch()
    }

    if (currentView === "suppliers") {
        return (
            <div className="flex min-h-screen bg-muted/40 text-foreground transition-colors duration-300">
                <div className="hidden lg:block w-80 border-r border-border bg-card sticky top-0 h-screen overflow-y-auto">
                    <AppSidebar />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <SupplierManager onBack={() => setCurrentView("main")} />
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-muted/40 text-foreground transition-colors duration-300">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-80 border-r border-border bg-card sticky top-0 h-screen overflow-y-auto">
                <AppSidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-card border-b border-border/50 lg:hidden">
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
                    <h1 className="text-xl font-bold tracking-tight">Inventory</h1>
                </header>

                {/* Desktop Header */}
                <header className="hidden lg:flex items-center h-[64px] px-6 bg-card border-b border-border/50 sticky top-0 z-30">
                    <div className="pl-[44px]">
                        <h1 className="text-xl font-bold tracking-tight">Inventory</h1>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 lg:p-12 w-full mx-auto overflow-y-auto">
                    <div className="max-w-[1440px] mx-auto h-[calc(100vh-8rem)]">
                        <Card className="h-full border-none shadow-sm flex flex-col bg-card overflow-hidden">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                                {/* Tab Navigation */}
                                <div className="border-b px-6 flex-shrink-0">
                                    <TabsList className="flex h-auto w-full justify-start gap-8 bg-transparent p-0">
                                        <TabsTrigger
                                            value="items"
                                            className="relative h-14 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4" />
                                                <span>Items</span>
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="stock"
                                            className="relative h-14 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary"
                                        >
                                            <div className="flex items-center gap-2">
                                                <ArrowRightLeft className="h-4 w-4" />
                                                <span>Stock</span>
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
                                    {/* Items Tab */}
                                    <TabsContent value="items" className="h-full p-6 space-y-6">
                                        <Button onClick={() => setShowAddItem(true)} className="w-full bg-primary hover:bg-primary/90 h-14 text-base">
                                            <Plus className="h-5 w-5 mr-2" />
                                            Add Item
                                        </Button>

                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-semibold">Items ({items.length})</h2>
                                            <Button variant="outline" size="icon">
                                                <Filter className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {isLoading ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                                                <p className="text-muted-foreground">Loading items...</p>
                                            </div>
                                        ) : items.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/5">
                                                <div className="bg-muted/20 p-4 rounded-full mb-4">
                                                    <Package className="h-10 w-10 text-muted-foreground/50" />
                                                </div>
                                                <p className="text-muted-foreground">No items found</p>
                                                <p className="text-sm text-muted-foreground/80 mt-1">Add your first item to get started</p>
                                            </div>
                                        ) : (
                                            <div className="border rounded-lg">
                                                <div className="grid grid-cols-5 p-4 border-b bg-muted/40 font-medium text-sm text-muted-foreground">
                                                    <div className="col-span-2">Item Name</div>
                                                    <div>Type</div>
                                                    <div>Unit</div>
                                                    <div className="text-right">Price</div>
                                                    <div className="text-right sr-only">Actions</div>
                                                </div>
                                                <div className="divide-y">
                                                    {items.map((item) => (
                                                        <div key={item.id} className="grid grid-cols-5 p-4 items-center hover:bg-muted/50 transition-colors cursor-pointer text-sm">
                                                            <div className="col-span-2 font-medium text-foreground">{item.name}</div>
                                                            <div>
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                                    {item.item_type}
                                                                </span>
                                                            </div>
                                                            <div className="text-muted-foreground">{item.unit_of_measure}</div>
                                                            <div className="text-right font-bold">{currency} {item.sale_price.toFixed(2)}</div>
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                                                    onClick={() => handleEditItem(item)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                    <span className="sr-only">Edit</span>
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                                                                    <Trash2 className="h-4 w-4" />
                                                                    <span className="sr-only">Delete</span>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Stock Tab */}
                                    <TabsContent value="stock" className="h-full p-6 space-y-8">
                                        {/* Action Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Stock In Card */}
                                            <Card
                                                className={`bg-card border transition-colors cursor-pointer ${activeShift
                                                    ? "hover:bg-accent/50"
                                                    : "opacity-50 cursor-not-allowed hover:bg-card"
                                                    }`}
                                                onClick={() => {
                                                    if (activeShift) {
                                                        setShowStockInDialog(true)
                                                    } else {
                                                        alert("Please open a shift to perform stock operations")
                                                    }
                                                }}
                                            >
                                                <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                                                    <ArrowDown className={`h-8 w-8 ${activeShift ? "text-green-500" : "text-gray-400"}`} />
                                                    <span className={`font-medium ${activeShift ? "text-green-500" : "text-gray-400"}`}>Stock In</span>
                                                </CardContent>
                                            </Card>

                                            {/* Stock Out Card */}
                                            <Card
                                                className={`bg-card border transition-colors cursor-pointer ${activeShift
                                                    ? "hover:bg-accent/50"
                                                    : "opacity-50 cursor-not-allowed hover:bg-card"
                                                    }`}
                                                onClick={() => {
                                                    if (activeShift) {
                                                        setShowStockOutDialog(true)
                                                    } else {
                                                        alert("Please open a shift to perform stock operations")
                                                    }
                                                }}
                                            >
                                                <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                                                    <ArrowUp className={`h-8 w-8 ${activeShift ? "text-red-500" : "text-gray-400"}`} />
                                                    <span className={`font-medium ${activeShift ? "text-red-500" : "text-gray-400"}`}>Stock Out</span>
                                                </CardContent>
                                            </Card>

                                            {/* Transfers Card */}
                                            <Card
                                                className={`bg-card border transition-colors cursor-pointer ${activeShift
                                                    ? "hover:bg-accent/50"
                                                    : "opacity-50 cursor-not-allowed hover:bg-card"
                                                    }`}
                                                onClick={() => {
                                                    if (!activeShift) {
                                                        alert("Please open a shift to perform stock operations")
                                                    }
                                                }}
                                            >
                                                <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                                                    <ArrowRightLeft className={`h-8 w-8 ${activeShift ? "text-blue-500" : "text-gray-400"}`} />
                                                    <span className={`font-medium ${activeShift ? "text-blue-500" : "text-gray-400"}`}>Transfers</span>
                                                </CardContent>
                                            </Card>

                                            {/* Stock Take Card */}
                                            <Card
                                                className={`bg-card border transition-colors cursor-pointer ${activeShift
                                                    ? "hover:bg-accent/50"
                                                    : "opacity-50 cursor-not-allowed hover:bg-card"
                                                    }`}
                                                onClick={() => {
                                                    if (activeShift) {
                                                        setShowStockTakeDialog(true)
                                                    } else {
                                                        alert("Please open a shift to perform stock operations")
                                                    }
                                                }}
                                            >
                                                <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                                                    <ClipboardList className={`h-8 w-8 ${activeShift ? "text-purple-500" : "text-gray-400"}`} />
                                                    <span className={`font-medium ${activeShift ? "text-purple-500" : "text-gray-400"}`}>Stock Take</span>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Recent Stock Transactions</h3>
                                            <StockTransactionsGrid />
                                        </div>
                                    </TabsContent>

                                    {/* Reports Tab */}
                                    <TabsContent value="reports" className="h-full p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Card
                                                className="border hover:border-primary/50 transition-colors cursor-pointer group"
                                                onClick={() => setShowSupplierReportDialog(true)}
                                            >
                                                <CardContent className="p-6 flex items-start gap-4">
                                                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                        <Building2 className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg mb-1">Supplier Deliveries</h3>
                                                        <p className="text-sm text-muted-foreground">Detailed report of items received from suppliers.</p>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card
                                                className="border hover:border-primary/50 transition-colors cursor-pointer group"
                                                onClick={() => setShowVarianceReportDialog(true)}
                                            >
                                                <CardContent className="p-6 flex items-start gap-4">
                                                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                        <ClipboardList className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg mb-1">Stock Variance</h3>
                                                        <p className="text-sm text-muted-foreground">Analyze discrepancies between expected and actual stock.</p>
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
                                                onClick={() => setCurrentView("suppliers")}
                                            >
                                                <CardContent className="p-6 flex items-start gap-4">
                                                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                        <Building2 className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg mb-1">Suppliers</h3>
                                                        <p className="text-sm text-muted-foreground">Manage item suppliers and contact information.</p>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card className="border hover:border-primary/50 transition-colors cursor-pointer group opacity-50">
                                                <CardContent className="p-6 flex items-start gap-4">
                                                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                        <Settings className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg mb-1">Inventory Settings</h3>
                                                        <p className="text-sm text-muted-foreground">Configure stock alerts and display preferences.</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </Card>
                    </div>
                </main>

                {/* Add/Edit Item Dialog */}
                <ItemFormDialog
                    open={showAddItem}
                    onOpenChange={handleCloseDialog}
                    item={selectedItem}
                    onSuccess={handleSuccess}
                />

                {/* Stock In Dialog */}
                <StockInDialog
                    open={showStockInDialog}
                    onOpenChange={setShowStockInDialog}
                    onSuccess={handleSuccess}
                />

                {/* Stock Out Dialog */}
                <StockOutDialog
                    open={showStockOutDialog}
                    onOpenChange={setShowStockOutDialog}
                    onSuccess={handleSuccess}
                />

                {/* Stock Take Dialog */}
                <StockTakeDialog
                    open={showStockTakeDialog}
                    onOpenChange={setShowStockTakeDialog}
                    onSuccess={handleSuccess}
                />

                <SupplierDeliveryReportDialog
                    open={showSupplierReportDialog}
                    onOpenChange={setShowSupplierReportDialog}
                />

                <VarianceReportDialog
                    open={showVarianceReportDialog}
                    onOpenChange={setShowVarianceReportDialog}
                />
            </div>
        </div>
    )
}
