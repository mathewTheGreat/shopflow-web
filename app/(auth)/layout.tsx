export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6 md:p-8 outline-none transition-colors duration-500">
            <div className="w-full max-w-[420px] flex flex-col items-center">
                {children}
            </div>
        </div>
    )
}
