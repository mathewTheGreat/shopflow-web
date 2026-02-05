"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Store, ArrowRight, Loader2, ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { Shop } from "@/types/shop"

export default function JoinBusinessPage() {
    const searchParams = useSearchParams()
    const existingUserId = searchParams.get("userId")

    const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [shops, setShops] = useState<Shop[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchShops = async () => {
            try {
                setIsLoading(true)
                const data = await apiClient.get<Shop[]>(`${process.env.NEXT_PUBLIC_API_URL}/api/shops`)
                setShops(data)
                setError(null)
            } catch (err: any) {
                console.error("Error fetching shops:", err)
                setError("Failed to load businesses. Please try again.")
            } finally {
                setIsLoading(false)
            }
        }

        fetchShops()
    }, [])

    const filteredShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex flex-col items-center space-y-6 relative">
            <Link href="/onboarding" className="absolute -top-12 left-0">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-600 transition-colors px-0">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </Link>

            <div className="text-center space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Join a Business</h1>
                <p className="text-sm text-muted-foreground">Select a business to join from the list below</p>
            </div>

            <div className="w-full space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search businesses..."
                        className="pl-10 h-14 bg-muted border-0 text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="space-y-3 pt-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-2">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-sm text-muted-foreground">Fetching businessess...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">
                            Failed to load businesses. Please try again.
                        </div>
                    ) : filteredShops?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No businesses found matching your search.
                        </div>
                    ) : (
                        filteredShops?.map((shop) => (
                            <Card
                                key={shop.id}
                                className={`bg-card border transition-all cursor-pointer ${selectedBusiness === shop.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-border hover:border-muted-foreground/50'}`}
                                onClick={() => setSelectedBusiness(shop.id)}
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center shrink-0">
                                        <Store className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-base truncate">{shop.name}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {shop.city}{shop.address ? `, ${shop.address}` : ""}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <div className="w-full pt-8">
                <Link href={`/onboarding/role?type=join&shopId=${selectedBusiness}${existingUserId ? `&userId=${existingUserId}` : ''}`}>
                    <Button
                        className="w-full h-14 text-base bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={!selectedBusiness}
                    >
                        <ArrowRight className="mr-2 h-5 w-5" />
                        Continue
                    </Button>
                </Link>
            </div>
        </div>
    )
}
