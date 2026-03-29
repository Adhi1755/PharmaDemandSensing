import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen w-screen app-bg overflow-hidden">
            <Sidebar />
            <main data-page-main="true" className="h-full w-full lg:pl-[68px] overflow-y-auto overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
