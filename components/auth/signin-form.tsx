"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function SignInForm() {
    const { isLoaded, signIn, setActive } = useSignIn()
    const router = useRouter()
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [showPassword, setShowPassword] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return

        setIsLoading(true)
        setError(null)

        try {
            const result = await signIn.create({
                identifier: email,
                password,
            })

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId })
                router.push("/")
            } else {
                console.error(JSON.stringify(result, null, 2))
                setError("Sign in incomplete. Please try again.")
            }
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2))

            let errorMessage = 'An error occurred during sign in'

            if (err.errors && err.errors.length > 0) {
                const clerkError = err.errors[0]

                switch (clerkError.code) {
                    case 'form_identifier_not_found':
                        errorMessage = 'No account found with this email address'
                        break
                    case 'form_password_incorrect':
                        errorMessage = 'Incorrect password. Please try again'
                        break
                    case 'form_param_format_invalid':
                        if (clerkError.meta?.paramName === 'identifier') {
                            errorMessage = 'Please enter a valid email address'
                        }
                        break
                    case 'session_exists':
                        errorMessage = 'You are already signed in'
                        break
                    case 'form_password_pwned':
                        errorMessage = 'This password has been compromised. Please choose a different password.'
                        break
                    default:
                        errorMessage = clerkError.longMessage || clerkError.message || errorMessage
                }
            } else if (err.message) {
                errorMessage = err.message
            }

            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        if (!isLoaded) return
        setIsLoading(true)
        setError(null)
        try {
            await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/",
            })
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2))
            setError("Google sign-in failed. Please try again.")
            setIsLoading(false)
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }

    const isFormValid = email.length > 0 && password.length > 0 && !isLoading

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-white dark:bg-gray-900">
            <div className="w-full max-w-sm mx-auto space-y-8">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="relative h-20 w-20 overflow-hidden rounded-xl">
                        <div className="h-full w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            {/* Placeholder for icon - replace with your actual icon */}
                            <Image
                                src="/shopflow_icon.png"
                                width={500}
                                height={500}
                                alt="Shopflow icon"
                            />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Welcome back
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sign in to your ShopFlow account
                    </p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-center text-red-600 dark:text-red-400">
                            {error}
                        </p>
                    </div>
                )}

                {/* Email Input */}
                <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="pl-10 h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                        required
                    />
                </div>

                {/* Password Input */}
                <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="pl-10 pr-10 h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                        required
                    />
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                        ) : (
                            <Eye className="h-5 w-5" />
                        )}
                    </button>
                </div>

                {/* Sign In Button */}
                <Button
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                    className={`w-full h-12 text-base font-semibold transition-all ${isFormValid
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        }`}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        <>
                            Continue
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                    )}
                </Button>

                {/* Sign Up Link */}
                <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Don't have an account?{" "}
                        <Link
                            href="/sign-up"
                            className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                            or
                        </span>
                    </div>
                </div>

                {/* Google Sign In */}
                <Button
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full h-12 text-base font-normal bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
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
        </div>
    )
}