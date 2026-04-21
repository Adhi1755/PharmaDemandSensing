import TopNav from "@/components/TopNav";
import { NavActionsProvider } from "@/context/NavActionsContext";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <NavActionsProvider>
            <div className="min-h-screen w-full app-bg flex flex-col">
                {/* Single persistent TopNav — never unmounts on navigation */}
                <TopNav />
                <main
                    data-page-main="true"
                    className="flex-1 w-full overflow-auto overflow-x-hidden"
                    style={{ background: "#080B10" }}
                >
                    {children}
                </main>
            </div>
        </NavActionsProvider>
    );
}
