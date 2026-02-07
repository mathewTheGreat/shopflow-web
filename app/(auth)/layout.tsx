export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-4 sm:p-6 md:p-8 outline-none">
            <div className="w-full max-w-[400px] flex flex-col items-center transition-all duration-500">
                {children}
            </div>
        </div>
    )
}
