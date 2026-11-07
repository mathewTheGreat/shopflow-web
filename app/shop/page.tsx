"use client"

import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowRightLeft, Loader2, Menu, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AppSidebar } from "@/components/app-sidebar"
import { roleService } from "@/services/role.service"
import { shopService } from "@/services/shop.service"
import { userService } from "@/services/user.service"
import { useAppStore } from "@/store/use-app-store"

export default function ShopPage() {
    const activeShop = useAppStore((state) => state.activeShop)
    const isManager = ["manager", "admin"].includes(activeShop?.role?.toLowerCase() || "")
    const queryClient = useQueryClient()
    const [cashierId, setCashierId] = useState("")
    const [destinationShopId, setDestinationShopId] = useState("")
    const [isTransferring, setIsTransferring] = useState(false)

    const { data: shops = [], error: shopsError } = useQuery({
        queryKey: ["shops"],
        queryFn: () => shopService.getShops(),
        enabled: isManager,
    })
    const { data: roles = [], isLoading: isLoadingRoles, error: rolesError } = useQuery({
        queryKey: ["roles"],
        queryFn: () => roleService.getRoles(),
        enabled: isManager,
    })
    const cashierRoleId = roles.find((role) => role.name.toLowerCase() === "cashier")?.id
    const { data: staff = [], isLoading: isLoadingStaff, error: staffError } = useQuery({
        queryKey: ["shop-transfer-cashiers", activeShop?.id, cashierRoleId],
        queryFn: () => userService.getUsersByRole(cashierRoleId!, activeShop!.id),
        enabled: isManager && !!activeShop?.id && !!cashierRoleId,
    })
    const { data: assignments = [], error: assignmentsError } = useQuery({
        queryKey: ["shop-staff", activeShop?.id],
        queryFn: () => userService.getShopStaff(activeShop!.id),
        enabled: isManager && !!activeShop?.id && !!cashierRoleId,
    })

    const activeCashiers = useMemo(() => {
        const activeIds = new Set(
            assignments.filter((assignment) => assignment.role_id === cashierRoleId).map((assignment) => assignment.user_id)
        )
        return staff.filter((cashier) => activeIds.has(cashier.id))
    }, [assignments, cashierRoleId, staff])
    const destinationShops = shops.filter((shop) => shop.id !== activeShop?.id)
    const selectedCashier = activeCashiers.find((cashier) => cashier.id === cashierId)

    const handleTransfer = async () => {
        if (!selectedCashier || !destinationShopId) {
            toast.error("Choose a cashier and destination shop")
            return
        }
        const destination = destinationShops.find((shop) => shop.id === destinationShopId)
        const confirmed = window.confirm(
            `Transfer ${selectedCashier.name} from ${activeShop?.name} to ${destination?.name}? Their active access to the current shop will end; prior sales and shift reports will remain attributed to this shop.`
        )
        if (!confirmed) return
        const sourceAssignment = assignments.find(
            (assignment) => assignment.user_id === selectedCashier.id && assignment.role_id === cashierRoleId
        )
        if (!sourceAssignment) {
            toast.error("The cashier's active assignment was not found. Refresh and try again.")
            return
        }

        setIsTransferring(true)
        try {
            await userService.transferCashier(sourceAssignment.id, destinationShopId)
            toast.success(`${selectedCashier.name} was transferred to ${destination?.name}`)
            setCashierId("")
            setDestinationShopId("")
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["shop-transfer-cashiers", activeShop?.id] }),
                queryClient.invalidateQueries({ queryKey: ["shop-staff", activeShop?.id] }),
                queryClient.invalidateQueries({ queryKey: ["report-cashiers"] }),
            ])
        } catch (error) {
            console.error("Cashier transfer failed:", error)
            toast.error(error instanceof Error ? error.message : "Cashier transfer failed")
        } finally {
            setIsTransferring(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
            <div className="hidden md:block w-80 border-r border-border bg-card sticky top-0 h-screen overflow-y-auto">
                <AppSidebar />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-card border-b border-border/50 md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="mr-4">
                                <span className="sr-only">Open navigation menu</span>
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] p-0 border-r-border bg-card">
                            <SheetTitle className="sr-only">Shop management navigation</SheetTitle>
                            <AppSidebar />
                        </SheetContent>
                    </Sheet>
                    <h1 className="text-xl font-bold tracking-tight">Shop management</h1>
                </header>

                <header className="hidden md:flex items-center h-[64px] px-6 bg-card border-b border-border/50 sticky top-0 z-30">
                    <div className="pl-[44px]">
                        <h1 className="text-xl font-bold tracking-tight">Shop management</h1>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 lg:p-12 w-full mx-auto overflow-y-auto scrollbar-hide">
                    <div className="max-w-[800px] mx-auto space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-lg font-bold">Staff and assignments</h2>
                            <p className="text-sm text-muted-foreground">
                                {activeShop
                                    ? `Manage staff assigned to ${activeShop.name}.`
                                    : "No shop is assigned to this account."}
                            </p>
                        </div>

                        {activeShop && isManager ? (
                            <Card className="bg-card border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ArrowRightLeft className="h-5 w-5 text-primary" />
                                        Transfer cashier
                                    </CardTitle>
                                    <CardDescription>
                                        A transfer changes the cashier&apos;s active shop. Historical sales and shifts remain attributed to this shop and stay available in reports.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {shopsError && <p role="alert" className="text-sm text-destructive">Could not load shops. Refresh and try again.</p>}
                                    {rolesError && <p role="alert" className="text-sm text-destructive">Could not load staff roles. Refresh and try again.</p>}
                                    {assignmentsError && <p role="alert" className="text-sm text-destructive">Could not load active staff assignments. Refresh and try again.</p>}
                                    {staffError && <p role="alert" className="text-sm text-destructive">Could not load this shop&apos;s cashiers. Refresh and try again.</p>}
                                    {!isLoadingRoles && !cashierRoleId && !rolesError && <p role="alert" className="text-sm text-destructive">The Cashier role is not configured.</p>}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Cashier</label>
                                            <Select value={cashierId} onValueChange={setCashierId} disabled={isLoadingStaff || !activeCashiers.length}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={isLoadingStaff ? "Loading cashiers..." : "Select a cashier"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {activeCashiers.map((cashier) => (
                                                        <SelectItem key={cashier.id} value={cashier.id}>{cashier.name || cashier.email}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Destination shop</label>
                                            <Select value={destinationShopId} onValueChange={setDestinationShopId} disabled={!destinationShops.length}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select a shop" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {destinationShops.map((shop) => (
                                                        <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {!isLoadingRoles && !isLoadingStaff && !staffError && !assignmentsError && activeCashiers.length === 0 && (
                                        <p className="text-sm text-muted-foreground">There are no active cashiers assigned to this shop.</p>
                                    )}
                                    <div className="flex justify-end border-t pt-4">
                                        <Button onClick={handleTransfer} disabled={!selectedCashier || !destinationShopId || isTransferring}>
                                            {isTransferring ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                                            Transfer cashier
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : activeShop ? (
                            <Card className="bg-card border shadow-sm">
                                <CardHeader>
                                    <CardTitle>Your shop assignment</CardTitle>
                                    <CardDescription>
                                        You are currently assigned to {activeShop.name}. Shop transfers are managed by a manager or administrator.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ) : (
                            <Card className="bg-card border shadow-sm">
                                <CardContent className="p-6 text-sm text-muted-foreground">
                                    Ask an administrator to assign you to a shop to access staff management.
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
