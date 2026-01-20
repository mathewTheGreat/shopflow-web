"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function SignUpForm() {
    const { isLoaded, signUp, setActive } = useSignUp()
    const router = useRouter()
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [verifying, setVerifying] = React.useState(false)
    const [code, setCode] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return

        setIsLoading(true)

        try {
            await signUp.create({
                emailAddress: email,
                password,
            })

            // Send the email.
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" })

            setVerifying(true)
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2))
            toast.error(err.errors?.[0]?.message || "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return

        setIsLoading(true)

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            })

            if (completeSignUp.status !== "complete") {
                /*  investigate the response, to see what is there */
                console.log(JSON.stringify(completeSignUp, null, 2))
            }

            if (completeSignUp.status === "complete") {
                await setActive({ session: completeSignUp.createdSessionId })
                router.push("/")
            }
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2))
            toast.error(err.errors?.[0]?.message || "Invalid code")
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSignUp = async () => {
        if (!isLoaded) return
        setIsLoading(true)
        try {
            await signUp.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/",
            })
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2))
            toast.error("Failed to start Google sign up")
            setIsLoading(false)
        }
    }

    if (verifying) {
        return (
            <div className="flex flex-col items-center space-y-6 w-full max-w-sm mx-auto p-4">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Verify your email</h1>
                    <p className="text-sm text-gray-500">
                        We sent a verification code to {email}
                    </p>
                </div>
                <form onSubmit={handleVerify} className="w-full space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Verification Code</Label>
                        <Input
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter code"
                            required
                            disabled={isLoading}
                            className="bg-white"
                        />
                    </div>
                    <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify Email
                    </Button>
                </form>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center space-y-6 w-full max-w-sm mx-auto">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-white shadow-sm">
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
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Create an account</h1>
                    <p className="text-sm text-gray-500">Get started with ShopFlow</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                        id="email"
                        placeholder="name@example.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        required
                        className="bg-white"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                        className="bg-white"
                    />
                </div>
                <Button className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white mt-2" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continue &rarr;
                </Button>
            </form>

            <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-gray-500">Already have an account? <Link href="/sign-in" className="text-blue-600 hover:text-blue-700 font-medium normal-case text-sm">Sign in</Link></span>
                </div>
            </div>

            <div className="relative w-full pb-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-gray-500">or</span>
                </div>
            </div>

            <Button
                variant="outline"
                className="w-full h-12 text-base font-normal bg-white border-gray-200 hover:bg-gray-50 text-gray-900"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
            >
                <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Continue with Google
            </Button>
        </div>
    )
}
