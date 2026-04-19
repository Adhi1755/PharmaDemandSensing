"use client";

import Link from "next/link";
import gsap from "gsap";
import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const COLLAPSED_WIDTH = 68;
const EXPANDED_WIDTH = 240;

const LOCAL_USER_KEY = "pharmasens_user";

const navItems = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
        ),
    },
    {
        label: "Forecast",
        href: "/dashboard/forecast",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M19 9l-5 5-3-3-4 4" /></svg>
        ),
    },
    {
        label: "Models",
        href: "/dashboard/models",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><path d="M8 7.5l2.5 7" /><path d="M16 7.5l-2.5 7" /><path d="M8 6h8" /></svg>
        ),
    },
    {
        label: "Inventory",
        href: "/dashboard/inventory",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1.1-1.79l-7-3.5a2 2 0 0 0-1.8 0l-7 3.5A2 2 0 0 0 3 8v8a2 2 0 0 0 1.1 1.79l7 3.5a2 2 0 0 0 1.8 0l7-3.5A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 4.5L20.7 7" /><path d="M12 22V11.5" /></svg>
        ),
    },
    {
        label: "Profile",
        href: "/dashboard/profile",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4" /><path d="M5.5 21a6.5 6.5 0 0 1 13 0" /></svg>
        ),
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const desktopSidebarRef = useRef<HTMLElement | null>(null);
    const expandedRef = useRef(false);
    const navItemsWithActive = useMemo(
        () =>
            navItems.map((item) => ({
                ...item,
                isActive:
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href)),
            })),
        [pathname]
    );

    useEffect(() => {
        if (!desktopSidebarRef.current) return;

        const ctx = gsap.context(() => {
            gsap.set(desktopSidebarRef.current, { width: COLLAPSED_WIDTH });
            gsap.set(".sidebar-text", { opacity: 0, x: -8, display: "none" });
            desktopSidebarRef.current?.classList.add("sidebar-collapsed");
            desktopSidebarRef.current?.classList.remove("sidebar-expanded");

            gsap.fromTo(
                desktopSidebarRef.current,
                { x: -36, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
            );
        }, desktopSidebarRef);

        return () => ctx.revert();
    }, []);

    const handleExpand = () => {
        if (!desktopSidebarRef.current || expandedRef.current) return;
        expandedRef.current = true;
        desktopSidebarRef.current.classList.remove("sidebar-collapsed");
        desktopSidebarRef.current.classList.add("sidebar-expanded");

        gsap.killTweensOf(desktopSidebarRef.current);
        gsap.killTweensOf(".sidebar-text");

        gsap.to(desktopSidebarRef.current, {
            width: EXPANDED_WIDTH,
            duration: 0.48,
            ease: "power2.out",
            overwrite: "auto",
        });

        gsap.set(".sidebar-text", { display: "block" });
        gsap.to(".sidebar-text", {
            opacity: 1,
            x: 0,
            duration: 0.24,
            ease: "power2.out",
            stagger: 0.02,
            delay: 0.08,
            overwrite: "auto",
        });
    };

    const handleCollapse = () => {
        if (!desktopSidebarRef.current || !expandedRef.current) return;
        expandedRef.current = false;

        gsap.killTweensOf(desktopSidebarRef.current);
        gsap.killTweensOf(".sidebar-text");

        gsap.to(".sidebar-text", {
            opacity: 0,
            x: -8,
            duration: 0.16,
            ease: "power2.out",
            stagger: 0.015,
            onComplete: () => { gsap.set(".sidebar-text", { display: "none" }); },
            overwrite: "auto",
        });

        gsap.to(desktopSidebarRef.current, {
            width: COLLAPSED_WIDTH,
            duration: 0.48,
            ease: "power2.out",
            overwrite: "auto",
            onComplete: () => {
                desktopSidebarRef.current?.classList.add("sidebar-collapsed");
                desktopSidebarRef.current?.classList.remove("sidebar-expanded");
            },
        });
    };

    const handleLogout = () => {
        localStorage.removeItem(LOCAL_USER_KEY);
        router.push("/");
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                ref={desktopSidebarRef}
                onMouseEnter={handleExpand}
                onMouseLeave={handleCollapse}
                className="hidden lg:flex flex-col h-full fixed left-0 top-0 z-40 overflow-hidden"
                style={{
                    background: "linear-gradient(180deg, #06080D 0%, #080B10 100%)",
                    borderRight: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "2px 0 24px rgba(0,0,0,0.5)",
                }}
            >
                <div className="sidebar-header h-16 px-3 flex items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <Link href="/" className="sidebar-brand flex items-center justify-center gap-0 no-underline w-full">
                        <span style={{ color: "#DA3633", fontSize: "2.2rem", fontWeight: 300, lineHeight: 1 }}>+</span>
                    </Link>
                </div>

                <nav className="flex-1 py-2 px-0 overflow-y-auto">
                    {navItemsWithActive.map((item) => {
                        const { isActive } = item;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                data-sidebar-active={isActive}
                                className={`sidebar-item relative group flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 no-underline ${
                                    isActive
                                    ? "text-[#E6EDF3]"
                                    : "text-[#6E7681] hover:text-[#C9D1D9]"
                                }`}
                                style={isActive ? {
                                    background: "linear-gradient(90deg, rgba(218,54,51,0.22) 0%, rgba(218,54,51,0.06) 100%)",
                                    borderLeft: "2px solid #DA3633",
                                } : { borderLeft: "2px solid transparent" }}
                            >
                                <span style={isActive ? { color: "#DA3633" } : undefined}>{item.icon}</span>
                                <span className="sidebar-text whitespace-nowrap">{item.label}</span>
                                <span className="sidebar-tooltip pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 border border-[rgba(255,255,255,0.1)] bg-[rgba(4,6,10,0.97)] px-2.5 py-1.5 text-xs text-[#C9D1D9] opacity-0 transition-opacity duration-150 whitespace-nowrap z-50 rounded-lg shadow-xl">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="sidebar-item relative group w-full flex items-center justify-center gap-3 px-4 py-3.5 text-sm font-medium transition-all duration-200"
                        style={{ color: "#6E7681", borderLeft: "2px solid transparent" }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.color = "#F85149";
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(218,54,51,0.08)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.color = "#6E7681";
                            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        <span className="sidebar-text whitespace-nowrap">Logout</span>
                        <span className="sidebar-tooltip pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 border border-[rgba(255,255,255,0.1)] bg-[rgba(4,6,10,0.97)] px-2.5 py-1.5 text-xs text-[#C9D1D9] opacity-0 transition-opacity duration-150 whitespace-nowrap z-50 rounded-lg shadow-xl">
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* Mobile bottom nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around py-2 px-0"
                style={{
                    background: "rgba(8,11,16,0.98)",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    backdropFilter: "blur(20px)",
                }}
            >
                {navItemsWithActive.map((item) => {
                    const { isActive } = item;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 px-3 py-1.5 text-[10px] font-medium transition-colors no-underline rounded-xl ${
                                isActive ? "text-[#DA3633]" : "text-[#6E7681] hover:text-[#C9D1D9]"
                            }`}
                        >
                            {item.icon}
                            <span className="truncate max-w-15">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
