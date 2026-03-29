"use client";

import Link from "next/link";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const COLLAPSED_WIDTH = 68;
const EXPANDED_WIDTH = 240;

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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
        ),
    },
    {
        label: "Inventory",
        href: "/dashboard/inventory",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
        ),
    },
    {
        label: "Location Insights",
        href: "/dashboard/insights",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
        ),
    },
    {
        label: "Model Insights",
        href: "/dashboard/model",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
        ),
    },
    {
        label: "Demand Patterns",
        href: "/dashboard/demand",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
        ),
    },
    {
        label: "AI Recommendations",
        href: "/dashboard/recommendations",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
        ),
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const desktopSidebarRef = useRef<HTMLElement | null>(null);
    const expandedRef = useRef(false);

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
            onComplete: () => gsap.set(".sidebar-text", { display: "none" }),
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

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                ref={desktopSidebarRef}
                onMouseEnter={handleExpand}
                onMouseLeave={handleCollapse}
                className="hidden lg:flex flex-col bg-[var(--color-dark-gray)] min-h-screen fixed left-0 top-0 z-40 border-r border-[rgba(224,226,228,0.14)] overflow-hidden"
            >
                <div className="sidebar-header py-6 px-3 border-b border-[rgba(224,226,228,0.14)]">
                    <Link href="/" className="sidebar-brand flex items-center justify-center gap-3 no-underline">
                        <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E0E2E4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" /><path d="M3 21h18" /><path d="M9 7h1" /><path d="M9 11h1" /><path d="M9 15h1" /><path d="M14 7h1" /><path d="M14 11h1" /><path d="M14 15h1" /></svg>
                        </div>
                        <div className="sidebar-text whitespace-nowrap">
                            <span className="text-[var(--color-light-gray)] font-bold text-lg leading-tight block">PharmaSense</span>
                            <span className="text-[rgba(224,226,228,0.72)] text-xs">AI Demand Sensing</span>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                data-sidebar-active={isActive}
                                className={`sidebar-item relative group flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 no-underline ${isActive
                                        ? "text-[var(--color-light-gray)] shadow-sm"
                                        : "text-[rgba(224,226,228,0.72)] hover:text-[var(--color-light-gray)] hover:bg-[rgba(255,0,0,0.12)]"
                                    }`}
                                style={isActive ? { background: "linear-gradient(90deg, rgba(192, 0, 24, 0.42), rgba(255, 0, 0, 0.2))" } : undefined}
                            >
                                <span className={isActive ? "text-[var(--color-primary)]" : ""}>{item.icon}</span>
                                <span className="sidebar-text whitespace-nowrap">{item.label}</span>
                                <span className="sidebar-tooltip pointer-events-none absolute left-[64px] top-1/2 -translate-y-1/2 rounded-md border border-[rgba(224,226,228,0.16)] bg-[rgba(0,0,0,0.96)] px-2 py-1 text-xs text-[var(--color-light-gray)] opacity-0 transition-opacity duration-150 whitespace-nowrap z-50">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-[rgba(224,226,228,0.14)]">
                    <Link
                        href="/"
                        className="sidebar-item relative group flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[rgba(224,226,228,0.72)] hover:text-[var(--color-light-gray)] hover:bg-[rgba(255,0,0,0.12)] transition-all duration-200 no-underline"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        <span className="sidebar-text whitespace-nowrap">Logout</span>
                        <span className="sidebar-tooltip pointer-events-none absolute left-[64px] top-1/2 -translate-y-1/2 rounded-md border border-[rgba(224,226,228,0.16)] bg-[rgba(0,0,0,0.96)] px-2 py-1 text-xs text-[var(--color-light-gray)] opacity-0 transition-opacity duration-150 whitespace-nowrap z-50">
                            Logout
                        </span>
                    </Link>
                </div>
            </aside>

            {/* Mobile bottom nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-dark-gray)] border-t border-[rgba(224,226,228,0.14)] z-50 flex justify-around py-2 px-1">
                {navItems.slice(0, 5).map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors no-underline ${isActive ? "text-[var(--color-primary)]" : "text-[rgba(224,226,228,0.72)] hover:text-[var(--color-light-gray)]"
                                }`}
                        >
                            {item.icon}
                            <span className="truncate max-w-[60px]">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
