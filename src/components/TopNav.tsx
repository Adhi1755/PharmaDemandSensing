"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useNavActions } from "@/context/NavActionsContext";

const LOCAL_USER_KEY = "pharmasens_user";

const navItems = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
        ),
    },
    {
        label: "Forecast",
        href: "/dashboard/forecast",
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M19 9l-5 5-3-3-4 4" /></svg>
        ),
    },
    {
        label: "Models",
        href: "/dashboard/models",
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><path d="M8 7.5l2.5 7" /><path d="M16 7.5l-2.5 7" /><path d="M8 6h8" /></svg>
        ),
    },
    {
        label: "Inventory",
        href: "/dashboard/inventory",
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1.1-1.79l-7-3.5a2 2 0 0 0-1.8 0l-7 3.5A2 2 0 0 0 3 8v8a2 2 0 0 0 1.1 1.79l7 3.5a2 2 0 0 0 1.8 0l7-3.5A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 4.5L20.7 7" /><path d="M12 22V11.5" /></svg>
        ),
    },
    {
        label: "Profile",
        href: "/dashboard/profile",
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4" /><path d="M5.5 21a6.5 6.5 0 0 1 13 0" /></svg>
        ),
    },
];

export default function TopNav() {
    const pathname = usePathname();
    const router = useRouter();
    // Pull alert count + callbacks from context (set by individual pages)
    const { alertCount, onBellClick, onCalendarClick } = useNavActions();

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

    const handleLogout = () => {
        localStorage.removeItem(LOCAL_USER_KEY);
        router.push("/");
    };

    return (
        <header
            className="sticky top-0 z-40 w-full"
            style={{
                background: "linear-gradient(180deg, rgba(6,8,13,0.99) 0%, rgba(8,11,16,0.96) 100%)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 1px 0 rgba(218,54,51,0.12), 0 4px 32px rgba(0,0,0,0.5)",
            }}
        >
            {/* ── Main nav row ── */}
            <div className="flex h-16 items-center justify-between px-5 md:px-8 max-w-[1400px] mx-auto">

                {/* Brand */}
                <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0 group">
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-105"
                        style={{
                            background: "linear-gradient(135deg, #DA3633 0%, #F85149 100%)",
                            boxShadow: "0 0 16px rgba(218,54,51,0.35)",
                        }}
                    >
                        <span style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 300, lineHeight: 1 }}>+</span>
                    </div>
                    <span
                        className="hidden sm:block text-[15px] font-semibold tracking-tight"
                        style={{ color: "#E6EDF3" }}
                    >
                        Pharma<span style={{ color: "#DA3633" }}>Sens</span>
                    </span>
                </Link>

                {/* ── Desktop nav links ── */}
                <nav className="hidden md:flex items-center gap-1">
                    {navItemsWithActive.map((item) => {
                        const { isActive } = item;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 no-underline"
                                style={{
                                    color: isActive ? "#E6EDF3" : "#6E7681",
                                    background: isActive
                                        ? "linear-gradient(135deg, rgba(218,54,51,0.18) 0%, rgba(218,54,51,0.08) 100%)"
                                        : "transparent",
                                    border: isActive
                                        ? "1px solid rgba(218,54,51,0.25)"
                                        : "1px solid transparent",
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLAnchorElement).style.color = "#C9D1D9";
                                        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
                                        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.08)";
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLAnchorElement).style.color = "#6E7681";
                                        (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                                        (e.currentTarget as HTMLAnchorElement).style.borderColor = "transparent";
                                    }
                                }}
                            >
                                <span style={isActive ? { color: "#DA3633" } : undefined}>{item.icon}</span>
                                {item.label}
                                {isActive && (
                                    <span
                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full"
                                        style={{ background: "linear-gradient(90deg, #DA3633, #F85149)" }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* ── Right actions ── */}
                <div className="flex items-center gap-2">
                    {/* Live badge */}
                    <span
                        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wider uppercase"
                        style={{
                            background: "rgba(63,185,80,0.08)",
                            border: "1px solid rgba(63,185,80,0.2)",
                            color: "#3FB950",
                        }}
                    >
                        <span className="h-1.5 w-1.5 rounded-full pulse-red" style={{ background: "#3FB950" }} />
                        Live
                    </span>

                    {/* Calendar (Reorder Planner) — only active when callback is wired */}
                    <button
                        id="navbar-reorder-btn"
                        onClick={onCalendarClick}
                        className="relative p-2.5 rounded-xl transition-all duration-200"
                        title="Reorder Planner"
                        style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            opacity: onCalendarClick ? 1 : 0.4,
                            cursor: onCalendarClick ? "pointer" : "default",
                        }}
                        onMouseEnter={e => {
                            if (!onCalendarClick) return;
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(251,191,36,0.1)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(251,191,36,0.25)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                        }}
                    >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8B949E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </button>

                    {/* Bell (Notification Tray) */}
                    <button
                        id="navbar-notifications-btn"
                        onClick={onBellClick}
                        className="relative p-2.5 rounded-xl transition-all duration-200"
                        title="Alert Center"
                        style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            opacity: onBellClick ? 1 : 0.4,
                            cursor: onBellClick ? "pointer" : "default",
                        }}
                        onMouseEnter={e => {
                            if (!onBellClick) return;
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(218,54,51,0.1)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(218,54,51,0.25)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                        }}
                    >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8B949E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        {alertCount > 0 ? (
                            <span
                                className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
                                style={{ background: "#DA3633", color: "#fff" }}
                            >
                                {alertCount > 9 ? "9+" : alertCount}
                            </span>
                        ) : (
                            <span
                                className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full pulse-red"
                                style={{ background: "#DA3633" }}
                            />
                        )}
                    </button>

                    {/* Divider */}
                    <div className="hidden sm:block h-6 w-px mx-1" style={{ background: "rgba(255,255,255,0.08)" }} />

                    {/* Logout */}
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-200"
                        style={{ color: "#6E7681", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.color = "#F85149";
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(218,54,51,0.08)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(218,54,51,0.2)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.color = "#6E7681";
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Logout
                    </button>
                </div>
            </div>

            {/* ── Mobile bottom nav ── */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around py-2"
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
                            className={`flex flex-col items-center gap-1 px-3 py-1.5 text-[10px] font-medium transition-colors no-underline rounded-xl ${isActive ? "text-[#DA3633]" : "text-[#6E7681]"
                                }`}
                        >
                            {item.icon}
                            <span className="truncate max-w-15">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </header>
    );
}
