import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen w-full app-bg overflow-hidden">
            <Sidebar />
            <main data-page-main="true" className="h-full w-full lg:pl-17 overflow-auto overflow-x-hidden" style={{ background: "#080B10" }}>
                {children}
            </main>
        </div>
    );
}

