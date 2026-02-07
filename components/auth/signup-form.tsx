"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react"
import { toast } from "sonner"

export function SignUpForm() {
    const { isLoaded, signUp, setActive } = useSignUp()
    const router = useRouter()
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [showPassword, setShowPassword] = React.useState(false)
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
                router.push("/onboarding")
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
                redirectUrlComplete: "/onboarding",
            })
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2))
            toast.error("Failed to start Google sign up")
            setIsLoading(false)
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }

    if (verifying) {
        return (
            <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Verify your email</h1>
                    <p className="text-sm text-muted-foreground">
                        We sent a verification code to {email}
                    </p>
                </div>
                <form onSubmit={handleVerify} className="w-full space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code" className="text-sm font-bold text-muted-foreground ml-1">Verification Code</Label>
                        <Input
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter code"
                            required
                            disabled={isLoading}
                            className="h-14 bg-white/40 dark:bg-white/5 backdrop-blur-sm border-gray-200 dark:border-white/10 focus:border-primary dark:focus:border-primary rounded-2xl transition-all"
                        />
                    </div>
                    <Button className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-white transition-all rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98]" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        Verify Email
                    </Button>
                </form>
            </div>
        )
    }

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <Image
                        src="/shopflow_icon.png"
                        alt="ShopFlow"
                        width={160}
                        height={160}
                        className="object-contain p-2"
                        priority
                    />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h1>
                    <p className="text-sm text-muted-foreground">Get started with ShopFlow</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-bold text-muted-foreground ml-1">Email address</Label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                        </div>
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
                            className="pl-12 h-14 bg-white/40 dark:bg-white/5 backdrop-blur-sm border-gray-200 dark:border-white/10 focus:border-primary dark:focus:border-primary rounded-2xl transition-all"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-bold text-muted-foreground ml-1">Password</Label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            required
                            className="pl-12 pr-12 h-14 bg-white/40 dark:bg-white/5 backdrop-blur-sm border-gray-200 dark:border-white/10 focus:border-primary dark:focus:border-primary rounded-2xl transition-all"
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            disabled={isLoading}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Clerk's CAPTCHA widget */}
                <div id="clerk-captcha" />


                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-white transition-all rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] mt-2"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Signing up...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span>Continue</span>
                            <ArrowRight className="h-5 w-5" />
                        </div>
                    )}
                </Button>
            </form>

            <div className="text-center">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                        href="/sign-in"
                        className="font-semibold text-primary hover:text-primary/90 dark:text-primary dark:hover:text-primary/80"
                    >
                        Sign in
                    </Link>
                </p>
            </div>

            <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-background text-muted-foreground transition-colors duration-500">
                        or
                    </span>
                </div>
            </div>

            <Button
                variant="outline"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                className="w-full h-14 text-base font-normal bg-white/40 dark:bg-white/5 backdrop-blur-sm border-gray-200 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 text-gray-900 dark:text-gray-100 rounded-2xl transition-all"
            >
                <svg
                    className="mr-3 h-5 w-5"
                    aria-hidden="true"
                    focusable="false"
                    viewBox="0 0 488 512"
                >
                    <path
                        fill="currentColor"
                        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                    />
                </svg>
                Continue with Google
            </Button>
        </div>
    )
}
