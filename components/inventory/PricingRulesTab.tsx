"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2, Loader2, Store } from "lucide-react"
import { useItemPricing, useCreateItemPricing, useUpdateItemPricing, useDeleteItemPricing } from "@/hooks/use-item-pricing"
import { useAppStore } from "@/store/use-app-store"
import { ItemPricing } from "@/types/pricing"
import { Switch } from "@/components/ui/switch"
import { v4 as uuidv4 } from "uuid"

interface PricingRulesTabProps {
    itemId: string
    itemName: string
}

export function PricingRulesTab({ itemId, itemName }: PricingRulesTabProps) {
    const [showForm, setShowForm] = useState(false)
    const [editingRule, setEditingRule] = useState<ItemPricing | null>(null)
    const activeShop = useAppStore((state) => state.activeShop)
    const userInfo = useAppStore((state) => state.userInfo)
    const currency = useAppStore((state) => state.userCurrency) || "KES"

    const { pricingRules, isLoading, refetch } = useItemPricing(itemId, activeShop?.id)
    const createMutation = useCreateItemPricing()
    const updateMutation = useUpdateItemPricing()
    const deleteMutation = useDeleteItemPricing()

    // Form state
    const [formData, setFormData] = useState({
        override_price: "",
        min_quantity: "",
        max_quantity: "",
        is_active: true,
    })

    const resetForm = () => {
        setFormData({
            override_price: "",
            min_quantity: "",
            max_quantity: "",
            is_active: true,
        })
        setEditingRule(null)
        setShowForm(false)
    }

    const handleEdit = (rule: ItemPricing) => {
        setEditingRule(rule)
        setFormData({
            override_price: rule.override_price.toString(),
            min_quantity: rule.min_quantity?.toString() || "",
            max_quantity: rule.max_quantity?.toString() || "",
            is_active: rule.is_active,
        })
        setShowForm(true)
    }

    const handleDelete = async (ruleId: string) => {
        if (!confirm("Are you sure you want to delete this pricing rule?")) {
            return
        }

        try {
            await deleteMutation.mutateAsync(ruleId)
            refetch()
        } catch (error: any) {
            alert(error.message || "Failed to delete pricing rule")
        }
    }

    const handleSubmit = async () => {
        if (!activeShop) {
            alert("Please select a shop first")
            return
        }

        if (!formData.override_price || parseFloat(formData.override_price) <= 0) {
            alert("Valid override price is required")
            return
        }

        if (!userInfo?.id) {
            alert("User information not available")
            return
        }

        try {
            const ruleData = {
                item_id: itemId,
                shop_id: activeShop.id,
                override_price: parseFloat(formData.override_price),
                min_quantity: formData.min_quantity ? parseFloat(formData.min_quantity) : null,
                max_quantity: formData.max_quantity ? parseFloat(formData.max_quantity) : null,
                is_active: formData.is_active,
                created_by: userInfo.id,
            }

            if (editingRule) {
                await updateMutation.mutateAsync({
                    id: editingRule.id,
                    data: ruleData,
                })
            } else {
                await createMutation.mutateAsync({
                    ...ruleData,
                    id: uuidv4(),
                })
            }

            refetch()
            resetForm()
        } catch (error: any) {
            alert(error.message || "Failed to save pricing rule")
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold">Pricing Rules for {itemName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Set shop-specific prices and quantity-based pricing tiers
                    </p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Rule
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
                                Rules will be created for this shop
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
                                {editingRule ? "Edit Pricing Rule" : "New Pricing Rule"}
                            </h4>
                            <Button variant="ghost" size="sm" onClick={resetForm}>
                                Cancel
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Override Price */}
                            <div className="md:col-span-2">
                                <Label htmlFor="override_price" className="text-base mb-2 block">
                                    Override Price ({currency}) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="override_price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={formData.override_price}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, override_price: e.target.value }))
                                    }
                                    className="h-12 text-base"
                                />
                            </div>

                            {/* Minimum Quantity */}
                            <div>
                                <Label htmlFor="min_quantity" className="text-base mb-2 block">
                                    Minimum Quantity
                                </Label>
                                <Input
                                    id="min_quantity"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="e.g., 0.5 for half liter"
                                    value={formData.min_quantity}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, min_quantity: e.target.value }))
                                    }
                                    className="h-12 text-base"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Leave empty for no minimum
                                </p>
                            </div>

                            {/* Maximum Quantity */}
                            <div>
                                <Label htmlFor="max_quantity" className="text-base mb-2 block">
                                    Maximum Quantity
                                </Label>
                                <Input
                                    id="max_quantity"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Optional"
                                    value={formData.max_quantity}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, max_quantity: e.target.value }))
                                    }
                                    className="h-12 text-base"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Leave empty for no maximum
                                </p>
                            </div>

                            {/* Active Status */}
                            <div className="md:col-span-2 flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <Label htmlFor="is_active" className="text-base font-medium">
                                        Active Status
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Enable or disable this pricing rule
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
                                ) : editingRule ? (
                                    "Update Rule"
                                ) : (
                                    "Create Rule"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Rules List */}
            <div>
                <h4 className="text-lg font-semibold mb-4">Existing Rules ({pricingRules.length})</h4>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : pricingRules.length === 0 ? (
                    <Card className="border-2 border-dashed">
                        <CardContent className="p-12 text-center">
                            <div className="bg-muted/20 p-4 rounded-full w-fit mx-auto mb-4">
                                <Store className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                            <p className="text-muted-foreground">No pricing rules yet</p>
                            <p className="text-sm text-muted-foreground/80 mt-1">
                                Add your first pricing rule to get started
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {pricingRules.map((rule) => (
                            <Card key={rule.id} className="hover:border-primary/50 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Override Price</p>
                                                <p className="text-lg font-bold text-primary">
                                                    {currency} {rule.override_price.toFixed(2)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Min Quantity</p>
                                                <p className="text-base font-medium">
                                                    {rule.min_quantity ?? "No minimum"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Max Quantity</p>
                                                <p className="text-base font-medium">
                                                    {rule.max_quantity ?? "No maximum"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Status</p>
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${rule.is_active
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                        : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                                                        }`}
                                                >
                                                    {rule.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(rule)}
                                                className="h-8 w-8 text-primary hover:text-primary/90 hover:bg-primary/10"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(rule.id)}
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
