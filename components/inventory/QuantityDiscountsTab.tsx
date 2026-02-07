"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2, Loader2, Store, Percent as PercentIcon } from "lucide-react"
import { useQuantityDiscounts, useCreateQuantityDiscount, useUpdateQuantityDiscount, useDeleteQuantityDiscount } from "@/hooks/use-quantity-discounts"
import { useAppStore } from "@/store/use-app-store"
import { QuantityDiscount } from "@/types/pricing"
import { Switch } from "@/components/ui/switch"
import { v4 as uuidv4 } from "uuid"

interface QuantityDiscountsTabProps {
    itemId: string
    itemName: string
}

type DiscountType = "percentage" | "fixed"

export function QuantityDiscountsTab({ itemId, itemName }: QuantityDiscountsTabProps) {
    const [showForm, setShowForm] = useState(false)
    const [editingDiscount, setEditingDiscount] = useState<QuantityDiscount | null>(null)
    const activeShop = useAppStore((state) => state.activeShop)
    const userInfo = useAppStore((state) => state.userInfo)
    const currency = useAppStore((state) => state.userCurrency) || "KES"

    const { discounts, isLoading, refetch } = useQuantityDiscounts(itemId, activeShop?.id)
    const createMutation = useCreateQuantityDiscount()
    const updateMutation = useUpdateQuantityDiscount()
    const deleteMutation = useDeleteQuantityDiscount()

    // Form state
    const [formData, setFormData] = useState({
        min_quantity: "",
        discount_type: "percentage" as DiscountType,
        discount_value: "",
        is_active: true,
    })

    const resetForm = () => {
        setFormData({
            min_quantity: "",
            discount_type: "percentage",
            discount_value: "",
            is_active: true,
        })
        setEditingDiscount(null)
        setShowForm(false)
    }

    const handleEdit = (discount: QuantityDiscount) => {
        setEditingDiscount(discount)
        const discountType = discount.discount_percent ? "percentage" : "fixed"
        const discountValue = discount.discount_percent
            ? discount.discount_percent.toString()
            : discount.discount_amount?.toString() || ""

        setFormData({
            min_quantity: discount.min_quantity.toString(),
            discount_type: discountType,
            discount_value: discountValue,
            is_active: discount.is_active,
        })
        setShowForm(true)
    }

    const handleDelete = async (discountId: string) => {
        if (!confirm("Are you sure you want to delete this discount rule?")) {
            return
        }

        try {
            await deleteMutation.mutateAsync(discountId)
            refetch()
        } catch (error: any) {
            alert(error.message || "Failed to delete discount rule")
        }
    }

    const handleSubmit = async () => {
        if (!activeShop) {
            alert("Please select a shop first")
            return
        }

        if (!formData.min_quantity || parseFloat(formData.min_quantity) <= 0) {
            alert("Valid minimum quantity is required")
            return
        }

        if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
            alert("Valid discount value is required")
            return
        }

        if (formData.discount_type === "percentage" && parseFloat(formData.discount_value) > 100) {
            alert("Discount percentage cannot exceed 100%")
            return
        }

        if (!userInfo?.id) {
            alert("User information not available")
            return
        }

        try {
            const discountData = {
                item_id: itemId,
                shop_id: activeShop.id,
                min_quantity: parseFloat(formData.min_quantity),
                discount_percent: formData.discount_type === "percentage" ? parseFloat(formData.discount_value) : null,
                discount_amount: formData.discount_type === "fixed" ? parseFloat(formData.discount_value) : null,
                is_active: formData.is_active,
                created_by: userInfo.id,
            }

            if (editingDiscount) {
                await updateMutation.mutateAsync({
                    id: editingDiscount.id,
                    data: discountData,
                })
            } else {
                await createMutation.mutateAsync({
                    ...discountData,
                    id: uuidv4(),
                })
            }

            refetch()
            resetForm()
        } catch (error: any) {
            alert(error.message || "Failed to save discount rule")
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold">Quantity Discounts for {itemName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Set bulk discounts based on purchase quantity
                    </p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Discount
                    </Button>
                )}
            </div>

            {/* Current Shop Info */}
            {activeShop && (
                <Card className="bg-muted/50 border-l-4 border-l-primary">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Store className="h-5 w-5 text-primary" />
                        <div>
                            <p className="font-medium">Current Shop: {activeShop.name}</p>
                            <p className="text-sm text-muted-foreground">
                                Discounts will be created for this shop
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Form */}
            {showForm && (
                <Card className="border-2 border-primary/20">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold">
                                {editingDiscount ? "Edit Discount Rule" : "New Discount Rule"}
                            </h4>
                            <Button variant="ghost" size="sm" onClick={resetForm}>
                                Cancel
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Minimum Quantity */}
                            <div className="md:col-span-2">
                                <Label htmlFor="min_quantity" className="text-base mb-2 block">
                                    Minimum Quantity <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="min_quantity"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="e.g., 30 for 30+ pieces"
                                    value={formData.min_quantity}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, min_quantity: e.target.value }))
                                    }
                                    className="h-12 text-base"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Minimum quantity required to qualify for this discount
                                </p>
                            </div>

                            {/* Discount Type */}
                            <div className="md:col-span-2">
                                <Label className="text-base mb-3 block">
                                    Discount Type <span className="text-destructive">*</span>
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        type="button"
                                        variant={formData.discount_type === "percentage" ? "default" : "outline"}
                                        className="h-16 text-base flex flex-col gap-1"
                                        onClick={() =>
                                            setFormData((prev) => ({ ...prev, discount_type: "percentage" }))
                                        }
                                    >
                                        <PercentIcon className="h-5 w-5" />
                                        <span>Percentage</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={formData.discount_type === "fixed" ? "default" : "outline"}
                                        className="h-16 text-base flex flex-col gap-1"
                                        onClick={() =>
                                            setFormData((prev) => ({ ...prev, discount_type: "fixed" }))
                                        }
                                    >
                                        <span className="text-lg font-bold">{currency}</span>
                                        <span>Fixed Amount</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Discount Value */}
                            <div className="md:col-span-2">
                                <Label htmlFor="discount_value" className="text-base mb-2 block">
                                    {formData.discount_type === "percentage"
                                        ? "Discount Percentage"
                                        : `Discount Amount (${currency})`}{" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="discount_value"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={formData.discount_type === "percentage" ? "100" : undefined}
                                        placeholder={
                                            formData.discount_type === "percentage" ? "e.g., 5 for 5%" : "e.g., 2.00"
                                        }
                                        value={formData.discount_value}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, discount_value: e.target.value }))
                                        }
                                        className="h-12 text-base pr-12"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                        {formData.discount_type === "percentage" ? "%" : currency}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formData.discount_type === "percentage"
                                        ? "Enter a value between 0-100"
                                        : "Fixed amount to deduct per unit"}
                                </p>
                            </div>

                            {/* Example Calculation */}
                            {formData.min_quantity && formData.discount_value && (
                                <div className="md:col-span-2">
                                    <Card className="bg-primary/5 dark:bg-primary/10 border-primary/20">
                                        <CardContent className="p-4">
                                            <p className="text-sm font-medium text-foreground mb-2">
                                                Example Calculation
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                When buying {formData.min_quantity}+ units, customer gets{" "}
                                                {formData.discount_type === "percentage"
                                                    ? `${formData.discount_value}% off`
                                                    : `${currency} ${formData.discount_value} off per unit`}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Active Status */}
                            <div className="md:col-span-2 flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <Label htmlFor="is_active" className="text-base font-medium">
                                        Active Status
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Enable or disable this discount rule
                                    </p>
                                </div>
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) =>
                                        setFormData((prev) => ({ ...prev, is_active: checked }))
                                    }
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" onClick={resetForm}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="bg-primary hover:bg-primary/90"
                            >
                                {createMutation.isPending || updateMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : editingDiscount ? (
                                    "Update Discount"
                                ) : (
                                    "Create Discount"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Discounts List */}
            <div>
                <h4 className="text-lg font-semibold mb-4">Existing Discounts ({discounts.length})</h4>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : discounts.length === 0 ? (
                    <Card className="border-2 border-dashed">
                        <CardContent className="p-12 text-center">
                            <div className="bg-muted/20 p-4 rounded-full w-fit mx-auto mb-4">
                                <PercentIcon className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                            <p className="text-muted-foreground">No discount rules yet</p>
                            <p className="text-sm text-muted-foreground/80 mt-1">
                                Add your first discount rule to get started
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {discounts.map((discount) => (
                            <Card key={discount.id} className="hover:border-primary/50 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Min Quantity</p>
                                                <p className="text-lg font-bold">{discount.min_quantity}+</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Discount Type</p>
                                                <p className="text-base font-medium">
                                                    {discount.discount_percent ? "Percentage" : "Fixed Amount"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Discount Value</p>
                                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                                    {discount.discount_percent
                                                        ? `${discount.discount_percent}%`
                                                        : `${currency} ${discount.discount_amount?.toFixed(2)}`}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Status</p>
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${discount.is_active
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                        : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                                                        }`}
                                                >
                                                    {discount.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(discount)}
                                                className="h-8 w-8 text-primary hover:text-primary/90 hover:bg-primary/10"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(discount.id)}
                                                disabled={deleteMutation.isPending}
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                {deleteMutation.isPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
