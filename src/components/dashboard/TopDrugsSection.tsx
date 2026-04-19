"use client";

import type { TopDrug } from "@/lib/dashboard-data";

interface TopDrugsSectionProps {
    drugs: TopDrug[];
    status: "success" | "failed" | "fallback" | "loading";
}

const TREND_ICONS = {
    up: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        </svg>
    ),
    down: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
        </svg>
    ),
    stable: null,
};

function SkeletonRow() {
    return (
        <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.05)]">
            <div className="flex items-center gap-3">
                <div className="skeleton h-7 w-7 rounded-lg" />
                <div>
                    <div className="skeleton h-3 w-28 mb-1.5" />
                    <div className="skeleton h-2.5 w-16" />
                </div>
            </div>
            <div className="skeleton h-5 w-16 rounded-md" />
        </div>
    );
}

export default function TopDrugsSection({ drugs, status }: TopDrugsSectionProps) {
    if (status === "loading") {
        return (
            <section className="glass-card p-6">
                <div className="skeleton h-4 w-36 mb-5" />
                <div>
                    {[0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
                </div>
            </section>
        );
    }

    // Sort by totalDemand desc, top 5 only
    const top5 = [...drugs]
        .sort((a, b) => b.totalDemand - a.totalDemand)
        .slice(0, 5);

    return (
        <section className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                        Top Recommended Drugs
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                        Ranked by total demand from your dataset
                    </p>
                </div>
                {status === "fallback" && (
                    <span className="fallback-badge">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FBBF24]" />
                        Estimated
                    </span>
                )}
            </div>

            {top5.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
                    No drug data available yet. Run predictions to see rankings.
                </p>
            ) : (
                <ol className="space-y-0">
                    {top5.map((drug, idx) => {
                        const trendColor =
                            drug.trend === "up"
                                ? "text-[#3FB950] bg-[rgba(63,185,80,0.1)]"
                                : drug.trend === "down"
                                    ? "text-[#F85149] bg-[rgba(248,81,73,0.1)]"
                                    : "text-[var(--color-text-muted)] bg-[rgba(255,255,255,0.06)]";

                        return (
                            <li
                                key={`${drug.name}-${idx}`}
                                className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.05)] last:border-0 group hover:bg-[rgba(255,255,255,0.02)] -mx-2 px-2 rounded-lg transition-colors duration-150"
                            >
                                {/* Rank + name */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(255,255,255,0.05)] text-xs font-bold text-[var(--color-text-muted)] shrink-0">
                                        {idx + 1}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                            {drug.name}
                                        </p>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            Avg {drug.avgDemand.toFixed(0)} units/day
                                        </p>
                                    </div>
                                </div>

                                {/* Total demand + trend */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                                        {drug.totalDemand.toLocaleString()}
                                    </span>
                                    {drug.trend !== "stable" && (
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${trendColor}`}>
                                            {TREND_ICONS[drug.trend as keyof typeof TREND_ICONS]}
                                            {Math.abs(drug.changePercent).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}
