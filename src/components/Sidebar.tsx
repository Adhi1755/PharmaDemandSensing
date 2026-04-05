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
        label: "Re-upload Data",
        href: "/onboarding",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
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
                className="hidden lg:flex flex-col bg-[#000000] h-full fixed left-0 top-0 z-40 border-r border-[rgba(255,255,255,0.18)] overflow-hidden"
            >
                <div className="sidebar-header h-16 px-3 border-b border-[rgba(255,255,255,0.18)] flex items-center">
                    <Link href="/" className="sidebar-brand flex items-center justify-center gap-0 no-underline w-full">
                        <span className="text-(--color-primary) text-4xl font-light leading-none">+</span>
                    </Link>
                </div>

                <nav className="flex-1 py-0 px-0 overflow-y-auto">
                    {navItemsWithActive.map((item) => {
                        const { isActive } = item;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                data-sidebar-active={isActive}
                                className={`sidebar-item relative group flex items-center justify-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.12)] text-sm font-medium transition-colors duration-200 no-underline ${isActive
                                    ? "text-(--color-light-gray)"
                                    : "text-[rgba(191,191,191,1)] hover:text-(--color-light-gray) hover:bg-[rgba(255,0,0,0.12)]"
                                    }`}
                                style={isActive ? { background: "linear-gradient(90deg, rgba(255, 77, 77, 0.3), rgba(255, 0, 0, 0.18))" } : undefined}
                            >
                                <span className={isActive ? "text-(--color-primary)" : ""}>{item.icon}</span>
                                <span className="sidebar-text whitespace-nowrap">{item.label}</span>
                                <span className="sidebar-tooltip pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.96)] px-2 py-1 text-xs text-(--color-light-gray) opacity-0 transition-opacity duration-150 whitespace-nowrap z-50">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-[rgba(255,255,255,0.12)]">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="sidebar-item relative group w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-[rgba(191,191,191,1)] hover:text-(--color-light-gray) hover:bg-[rgba(255,0,0,0.12)] transition-colors duration-200"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        <span className="sidebar-text whitespace-nowrap">Logout</span>
                        <span className="sidebar-tooltip pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.96)] px-2 py-1 text-xs text-(--color-light-gray) opacity-0 transition-opacity duration-150 whitespace-nowrap z-50">
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* Mobile bottom nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#000000] border-t border-[rgba(255,255,255,0.12)] z-50 flex justify-around py-2 px-0">
                {navItemsWithActive.map((item) => {
                    const { isActive } = item;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 px-2 py-1.5 text-[10px] font-medium transition-colors no-underline ${isActive ? "text-(--color-primary)" : "text-[rgba(191,191,191,1)] hover:text-(--color-light-gray)"
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
