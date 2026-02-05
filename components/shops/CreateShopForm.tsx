"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Store as ShopIcon, MapPin, Building2, ArrowRight } from "lucide-react"
import { createShopSchema, type CreateShopInput } from "@/types/shop"

interface CreateShopFormProps {
    onSubmit: (data: CreateShopInput) => void
    isLoading?: boolean
}

export function CreateShopForm({ onSubmit, isLoading }: CreateShopFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<CreateShopInput>({
        resolver: zodResolver(createShopSchema)
    })

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Business Name</Label>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <ShopIcon className="h-5 w-5" />
                    </div>
                    <Input
                        id="name"
                        placeholder="e.g. ShopFlow HQ"
                        className="pl-10 h-12 bg-muted border-0"
                        {...register("name")}
                        disabled={isLoading}
                    />
                </div>
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <Input
                        id="city"
                        placeholder="e.g. Nairobi"
                        className="pl-10 h-12 bg-muted border-0"
                        {...register("city")}
                        disabled={isLoading}
                    />
                </div>
                {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <MapPin className="h-5 w-5" />
                    </div>
                    <Input
                        id="address"
                        placeholder="e.g. Ngong Road"
                        className="pl-10 h-12 bg-muted border-0"
                        {...register("address")}
                        disabled={isLoading}
                    />
                </div>
                {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
            </div>

            <div className="pt-4">
                <Button
                    type="submit"
                    className="w-full h-14 text-base bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isLoading}
                >
                    {isLoading ? "creating..." : (
                        <>
                            <ArrowRight className="mr-2 h-5 w-5" />
                            Continue to Role
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
