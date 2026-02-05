"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, DollarSign, Percent, X, Loader2 } from "lucide-react"
import { Item, itemService } from "@/services/item.service"
import { useAppStore } from "@/store/use-app-store"
import { useQueryClient } from "@tanstack/react-query"
import { PricingRulesTab } from "./PricingRulesTab"
import { QuantityDiscountsTab } from "./QuantityDiscountsTab"
import { v4 as uuidv4 } from "uuid"
import { Card, CardContent } from "../ui/card"

interface ItemFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item?: Item | null
    onSuccess?: () => void
}

const UNIT_OPTIONS = ["pcs", "kg", "g", "lb", "oz", "L", "mL", "m", "cm", "mm"]

export function ItemFormDialog({ open, onOpenChange, item, onSuccess }: ItemFormDialogProps) {
    const [activeTab, setActiveTab] = useState("basic")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentItemId, setCurrentItemId] = useState<string | null>(item?.id || null)
    const userInfo = useAppStore((state) => state.userInfo)
    const queryClient = useQueryClient()

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        item_type: "Sale" as "Sale" | "In-house",
        unit_of_measure: "pcs",
        sale_price: "",
        cost_price: "",
    })

    // Load item data when editing
    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name,
                description: item.description || "",
                item_type: item.item_type,
                unit_of_measure: item.unit_of_measure,
                sale_price: item.sale_price.toString(),
                cost_price: item.cost_price.toString(),
            })
            setCurrentItemId(item.id)
        } else {
            // Reset form for new item
            setFormData({
                name: "",
                description: "",
                item_type: "Sale",
                unit_of_measure: "pcs",
                sale_price: "",
                cost_price: "",
            })
            setCurrentItemId(null)
        }
    }, [item, open])

    // Reset tab when dialog closes
    useEffect(() => {
        if (!open) {
            setActiveTab("basic")
        }
    }, [open])

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSaveBasicInfo = async () => {
        if (!formData.name.trim()) {
            alert("Item name is required")
            return
        }

        if (!formData.sale_price || parseFloat(formData.sale_price) < 0) {
            alert("Valid sale price is required")
            return
        }

        if (!formData.cost_price || parseFloat(formData.cost_price) < 0) {
            alert("Valid cost price is required")
            return
        }

        setIsSubmitting(true)

        try {
            const itemData = {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                item_type: formData.item_type,
                unit_of_measure: formData.unit_of_measure,
                sale_price: parseFloat(formData.sale_price),
                cost_price: parseFloat(formData.cost_price),
            }

            if (currentItemId) {
                // Update existing item
                await itemService.update(currentItemId, itemData)
            } else {
                // Create new item
                const newItem = await itemService.create(itemData)
                setCurrentItemId(newItem.id)
            }

            // Invalidate items query to refresh the list
            queryClient.invalidateQueries({ queryKey: ["items"] })

            // Show success message
            alert(currentItemId ? "Item updated successfully!" : "Item created successfully!")

            // If creating new item, switch to pricing tab
            if (!currentItemId) {
                setActiveTab("pricing")
            }
        } catch (error: any) {
            console.error("Error saving item:", error)
            alert(error.message || "Failed to save item. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        onOpenChange(false)
        if (onSuccess) {
            onSuccess()
        }
    }

    const isNewItem = !currentItemId

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="h-[100vh] w-full p-0 gap-0 overflow-hidden flex flex-col max-w-none"
            >
                {/* Header */}
                <div className="sticky top-0 bg-card z-10 border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold">
                            {item ? "Edit Item" : "Add New Item"}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isNewItem ? "Create a new item and configure pricing" : "Update item details and pricing rules"}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    {/* Tab Navigation */}
                    <div className="border-b px-6 flex-shrink-0">
                        <TabsList className="flex h-auto w-full justify-start gap-8 bg-transparent p-0">
                            <TabsTrigger
                                value="basic"
                                className="relative h-14 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                            >
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    <span>Basic Info</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="pricing"
                                disabled={isNewItem}
                                className="relative h-14 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    <span>Pricing Rules</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="discounts"
                                disabled={isNewItem}
                                className="relative h-14 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-2">
                                    <Percent className="h-4 w-4" />
                                    <span>Quantity Discounts</span>
                                </div>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto min-h-0 bg-muted/30">
                        {/* Basic Info Tab */}
                        <TabsContent value="basic" className="p-6 md:p-8 lg:p-12 space-y-6 m-0">
                            <div className="max-w-5xl mx-auto">
                                <Card>
                                    <CardContent className="p-6 md:p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Item Name */}
                                            <div className="md:col-span-2">
                                                <Label htmlFor="name" className="text-base mb-2 block">
                                                    Item Name <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="name"
                                                    placeholder="Enter item name"
                                                    value={formData.name}
                                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                                    className="h-12 text-base"
                                                />
                                            </div>

                                            {/* Description */}
                                            <div className="md:col-span-2">
                                                <Label htmlFor="description" className="text-base mb-2 block">
                                                    Description
                                                </Label>
                                                <Input
                                                    id="description"
                                                    placeholder="Enter item description (optional)"
                                                    value={formData.description}
                                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                                    className="h-12 text-base"
                                                />
                                            </div>

                                            {/* Item Type */}
                                            <div>
                                                <Label className="text-base mb-3 block">
                                                    Item Type <span className="text-destructive">*</span>
                                                </Label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Button
                                                        type="button"
                                                        variant={formData.item_type === "In-house" ? "default" : "outline"}
                                                        className="h-14 text-base"
                                                        onClick={() => handleInputChange("item_type", "In-house")}
                                                    >
                                                        In-house
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={formData.item_type === "Sale" ? "default" : "outline"}
                                                        className="h-14 text-base"
                                                        onClick={() => handleInputChange("item_type", "Sale")}
                                                    >
                                                        Sale
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Unit of Measure */}
                                            <div>
                                                <Label className="text-base mb-3 block">
                                                    Unit of Measure <span className="text-destructive">*</span>
                                                </Label>
                                                <div className="grid grid-cols-5 gap-2">
                                                    {UNIT_OPTIONS.map((unit) => (
                                                        <Button
                                                            key={unit}
                                                            type="button"
                                                            variant={formData.unit_of_measure === unit ? "default" : "outline"}
                                                            className="h-12"
                                                            onClick={() => handleInputChange("unit_of_measure", unit)}
                                                        >
                                                            {unit}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Sale Price */}
                                            <div>
                                                <Label htmlFor="sale_price" className="text-base mb-2 block">
                                                    Sale Price (Optional)
                                                </Label>
                                                <Input
                                                    id="sale_price"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0.00"
                                                    value={formData.sale_price}
                                                    onChange={(e) => handleInputChange("sale_price", e.target.value)}
                                                    className="h-12 text-base"
                                                />
                                            </div>

                                            {/* Cost Price */}
                                            <div>
                                                <Label htmlFor="cost_price" className="text-base mb-2 block">
                                                    Cost Price <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="cost_price"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0.00"
                                                    value={formData.cost_price}
                                                    onChange={(e) => handleInputChange("cost_price", e.target.value)}
                                                    className="h-12 text-base"
                                                />
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                                            <Button variant="outline" onClick={handleClose} className="h-12 px-6">
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleSaveBasicInfo}
                                                disabled={isSubmitting}
                                                className="h-12 px-6 bg-primary hover:bg-primary/90"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : currentItemId ? (
                                                    "Update Item"
                                                ) : (
                                                    "Create Item"
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Pricing Rules Tab */}
                        <TabsContent value="pricing" className="p-6 md:p-8 lg:p-12 m-0">
                            <div className="max-w-5xl mx-auto">
                                {currentItemId ? (
                                    <PricingRulesTab itemId={currentItemId} itemName={formData.name} />
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        Save the item first to add pricing rules
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Quantity Discounts Tab */}
                        <TabsContent value="discounts" className="p-6 md:p-8 lg:p-12 m-0">
                            <div className="max-w-5xl mx-auto">
                                {currentItemId ? (
                                    <QuantityDiscountsTab itemId={currentItemId} itemName={formData.name} />
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        Save the item first to add quantity discounts
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}
