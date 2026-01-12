"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center space-y-6">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-xl">
                    <Image
                        src="/shopflow_icon.png"
                        alt="ShopFlow"
                        width={64}
                        height={64}
                        className="object-cover"
                        priority
                    />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                    <p className="text-sm text-muted-foreground">Sign in to your ShopFlow account</p>
                </div>
            </div>

            <div className="w-full space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input id="email" placeholder="name@example.com" type="email" autoCapitalize="none" autoComplete="email" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" />
                </div>
                <Button className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white">Continue &rarr;</Button>
            </div>

            <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted-foreground/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Don't have an account? <Link href="/signup" className="text-blue-500 hover:text-blue-600 font-medium normal-case text-sm">Sign up</Link></span>
                </div>
            </div>

            <div className="relative w-full pb-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted-foreground/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
            </div>

            <Button variant="outline" className="w-full h-12 text-base font-normal bg-transparent border-muted-foreground/30 hover:bg-accent hover:text-accent-foreground">
                <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Continue with Google
            </Button>
        </div>
    )
}
