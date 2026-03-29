import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Sidebar />
            <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
                {children}
            </main>
        </div>
    );
}
