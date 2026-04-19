"use client";

import type { DashboardKpis } from "@/lib/api";

interface ExtendedKpis extends DashboardKpis {
    totalDrugs?: number;
    highDemandAlerts?: number;
}

interface KPISectionProps {
    kpis: ExtendedKpis | null;
    status: "success" | "failed" | "fallback" | "loading";
}

const kpiConfig = [
    {
        key: "totalSales" as const,
        label: "Total Sales",
        format: (v: number) => `₹${v.toLocaleString("en-IN")}`,
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                <path d="M12 1v22" strokeLinecap="round" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
            </svg>
        ),
        accentColor: "#58A6FF",
    },
    {
        key: "forecastedSales" as const,
        label: "Forecasted Sales",
        format: (v: number) => `₹${v.toLocaleString("en-IN")}`,
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 9l-5 5-4-4-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        accentColor: "#3FB950",
    },
    {
        key: "modelAccuracy" as const,
        label: "Forecast Accuracy",
        format: (v: number) => v > 0 ? `${v.toFixed(1)}%` : "Estimated",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
                <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        accentColor: "#DA3633",
    },
];

function SkeletonCard() {
    return (
        <article className="glass-card relative overflow-hidden p-6">
            <div className="skeleton h-3 w-20 mb-4" />
            <div className="skeleton h-8 w-28 mb-2" />
            <div className="skeleton h-3 w-16" />
        </article>
    );
}

export default function KPISection({ kpis, status }: KPISectionProps) {
    if (status === "loading") {
        return (
            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
                {[0, 1, 2].map((i) => (
                    <SkeletonCard key={i} />
                ))}
            </section>
        );
    }

    return (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {kpiConfig.map((cfg, idx) => {
                const raw = kpis?.[cfg.key] ?? 0;
                // Prevent NaN / null display — fall back to 0
                const value = typeof raw === "number" && !Number.isNaN(raw) ? raw : 0;
                const isEstimated = status === "fallback" && value === 0;

                return (
                    <article
                        key={cfg.key}
                        className="glass-card dashboard-card relative overflow-hidden p-6 hover:scale-[1.01] transition-transform duration-300"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                        {/* Top accent line — unique color per card */}
                        <div
                            className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-70"
                            style={{ background: `linear-gradient(90deg, ${cfg.accentColor}, transparent)` }}
                        />

                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                                {cfg.label}
                            </p>
                            <div
                                className="flex h-9 w-9 items-center justify-center rounded-xl"
                                style={{ background: `${cfg.accentColor}18`, color: cfg.accentColor }}
                            >
                                {cfg.icon}
                            </div>
                        </div>

                        <p className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                            {isEstimated ? "—" : cfg.format(value)}
                        </p>

                        {status === "fallback" && (
                            <span className="fallback-badge mt-3">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FBBF24]" />
                                Using estimated values
                            </span>
                        )}
                    </article>
                );
            })}
        </section>
    );
}
