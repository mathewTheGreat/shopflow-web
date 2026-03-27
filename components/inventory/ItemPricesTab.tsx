"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { useItemPrices, useCreateItemPrice, useUpdateItemPrice, useDeactivateItemPrice } from "@/hooks/use-item-prices"
import { useAppStore } from "@/store/use-app-store"
import { ItemPrice } from "@/types/pricing"
import { getPriceQuantityLabel } from "@/lib/pricing"
import { toast } from "sonner"

interface ItemPricesTabProps {
    itemId: string
    itemName: string
}

export function ItemPricesTab({ itemId, itemName }: ItemPricesTabProps) {
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingPrice, setEditingPrice] = useState<ItemPrice | null>(null)
    const [newPrice, setNewPrice] = useState({ 
        label: "", 
        price: "",
        min_quantity: "1",
        max_quantity: ""
    })
    
    const activeShop = useAppStore((state) => state.activeShop)
    const userInfo = useAppStore((state) => state.userInfo)
    
    const { prices, isLoading, refetch } = useItemPrices(itemId, activeShop?.id || "")
    const createPrice = useCreateItemPrice()
    const updatePrice = useUpdateItemPrice()
    const deactivatePrice = useDeactivateItemPrice()

    const activePrices = prices.filter(p => p.is_active)
    const defaultPrice = activePrices.find(p => p.is_default)

    const handleAddPrice = async () => {
        if (!newPrice.label.trim() || !newPrice.price) {
            toast.error("Label and price are required")
            return
        }

        if (!activeShop?.id || !userInfo?.id) {
            toast.error("Shop or user not found")
            return
        }

        const minQty = parseFloat(newPrice.min_quantity) || 1
        const maxQty = newPrice.max_quantity ? parseFloat(newPrice.max_quantity) : null

        try {
            await createPrice.mutateAsync({
                item_id: itemId,
                shop_id: activeShop.id,
                label: newPrice.label.trim(),
                price: parseFloat(newPrice.price),
                min_quantity: minQty,
                max_quantity: maxQty,
                is_default: activePrices.length === 0,
                created_by: userInfo.id,
            })
            setNewPrice({ label: "", price: "", min_quantity: "1", max_quantity: "" })
            setShowAddForm(false)
            toast.success("Price option added")
            refetch()
        } catch (error) {
            toast.error("Failed to add price")
        }
    }

    const handleSetDefault = async (price: ItemPrice) => {
        try {
            // If clicking on current default, toggle it off
            if (price.is_default) {
                await updatePrice.mutateAsync({
                    id: price.id,
                    data: { is_default: false },
                })
                toast.success("Default removed")
            } else {
                await updatePrice.mutateAsync({
                    id: price.id,
                    data: { is_default: true },
                })
                toast.success("Default price updated")
            }
            refetch()
        } catch (error) {
            toast.error("Failed to update default price")
        }
    }

    const handleDeletePrice = async (priceId: string) => {
        if (!confirm("Are you sure you want to delete this price option?")) return
        
        try {
            await deactivatePrice.mutateAsync(priceId)
            toast.success("Price option deleted")
            refetch()
        } catch (error) {
            toast.error("Failed to delete price")
        }
    }

    const handleUpdatePrice = async () => {
        if (!editingPrice) return
        
        if (!newPrice.label.trim() || !newPrice.price) {
            toast.error("Label and price are required")
            return
        }

        const minQty = parseFloat(newPrice.min_quantity) || 1
        const maxQty = newPrice.max_quantity ? parseFloat(newPrice.max_quantity) : null

        try {
            await updatePrice.mutateAsync({
                id: editingPrice.id,
                data: {
                    label: newPrice.label.trim(),
                    price: parseFloat(newPrice.price),
                    min_quantity: minQty,
                    max_quantity: maxQty,
                },
            })
            setEditingPrice(null)
            setNewPrice({ label: "", price: "", min_quantity: "1", max_quantity: "" })
            toast.success("Price updated")
            refetch()
        } catch (error) {
            toast.error("Failed to update price")
        }
    }

    const startEdit = (price: ItemPrice) => {
        setEditingPrice(price)
        setNewPrice({ 
            label: price.label, 
            price: price.price.toString(),
            min_quantity: (price.min_quantity ?? 1).toString(),
            max_quantity: price.max_quantity?.toString() || ""
        })
    }

    const cancelEdit = () => {
        setEditingPrice(null)
        setShowAddForm(false)
        setNewPrice({ label: "", price: "", min_quantity: "1", max_quantity: "" })
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Price Options</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage different price options for {itemName}
                    </p>
                </div>
                <Button onClick={() => setShowAddForm(true)} disabled={showAddForm || !!editingPrice}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Price
                </Button>
            </div>

            {/* Add Price Form */}
            {showAddForm && (
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <h4 className="font-medium">Add New Price Option</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Label</Label>
                                <Input
                                    placeholder="e.g. Retail, Bulk, VIP"
                                    value={newPrice.label}
                                    onChange={(e) => setNewPrice(p => ({ ...p, label: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Price (KES)</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={newPrice.price}
                                    onChange={(e) => setNewPrice(p => ({ ...p, price: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Min Quantity</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    placeholder="1"
                                    value={newPrice.min_quantity}
                                    onChange={(e) => setNewPrice(p => ({ ...p, min_quantity: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Max Quantity (leave empty for unlimited)</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 0.5 for half unit"
                                    value={newPrice.max_quantity}
                                    onChange={(e) => setNewPrice(p => ({ ...p, max_quantity: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
                            <Button onClick={handleAddPrice} disabled={createPrice.isPending}>
                                {createPrice.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Add Price
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Edit Price Form */}
            {editingPrice && (
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <h4 className="font-medium">Edit Price Option</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Label</Label>
                                <Input
                                    placeholder="e.g. Retail, Bulk, VIP"
                                    value={newPrice.label}
                                    onChange={(e) => setNewPrice(p => ({ ...p, label: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Price (KES)</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={newPrice.price}
                                    onChange={(e) => setNewPrice(p => ({ ...p, price: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Min Quantity</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    placeholder="1"
                                    value={newPrice.min_quantity}
                                    onChange={(e) => setNewPrice(p => ({ ...p, min_quantity: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Max Quantity (leave empty for unlimited)</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 0.5 for half unit"
                                    value={newPrice.max_quantity}
                                    onChange={(e) => setNewPrice(p => ({ ...p, max_quantity: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
                            <Button onClick={handleUpdatePrice} disabled={updatePrice.isPending}>
                                {updatePrice.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Update Price
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Prices List */}
            {activePrices.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">No price options yet. Add your first price option above.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {activePrices
                        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                        .map((price) => (
                        <Card key={price.id} className={price.is_default ? "border-primary" : ""}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center">
                                        <label className="relative flex cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`default-price-${itemId}`}
                                                checked={price.is_default}
                                                onChange={() => handleSetDefault(price)}
                                                className="peer h-5 w-5 sr-only"
                                                disabled={updatePrice.isPending}
                                            />
                                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all
                                                ${price.is_default 
                                                    ? 'border-primary bg-primary' 
                                                    : 'border-muted-foreground/30 hover:border-primary/50'}`}>
                                                {price.is_default && (
                                                    <div className="h-2.5 w-2.5 rounded-full bg-white" />
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                    <div>
                                        <div className="font-medium">{price.label}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {price.is_default ? `Default ${getPriceQuantityLabel(price)}` : getPriceQuantityLabel(price)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-xl font-bold">
                                        KES {price.price.toLocaleString()}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => startEdit(price)}
                                            disabled={editingPrice !== null}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeletePrice(price.id)}
                                            disabled={deactivatePrice.isPending || activePrices.length <= 1}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> At least one price must remain. The default price will be used when no selection is made during sales.
                </p>
            </div>
        </div>
    )
}
