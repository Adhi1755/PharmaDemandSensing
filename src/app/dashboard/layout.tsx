import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen app-bg">
            <Sidebar />
            <main data-page-main="true" className="lg:ml-[68px] min-h-screen pb-20 lg:pb-0">
                {children}
            </main>
        </div>
    );
}
