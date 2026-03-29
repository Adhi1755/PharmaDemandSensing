"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getAIInsights } from "@/lib/api";

interface Insight {
    type: string;
    severity: string;
    title: string;
    message: string;
    action: string;
}

const severityStyles: Record<string, { card: string; badge: string; icon: string }> = {
    critical: {
        card: "border-l-4 border-l-[var(--color-primary)]",
        badge: "bg-[rgba(255,0,0,0.18)] text-[var(--color-primary)]",
        icon: "text-[var(--color-primary)]",
    },
    high: {
        card: "border-l-4 border-l-[var(--color-deep-red)]",
        badge: "bg-[rgba(255,77,77,0.22)] text-[var(--color-primary)]",
        icon: "text-[var(--color-deep-red)]",
    },
    medium: {
        card: "border-l-4 border-l-[rgba(191,191,191,1)]",
        badge: "bg-[rgba(255,255,255,0.12)] text-[var(--color-light-gray)]",
        icon: "text-[var(--color-light-gray)]",
    },
    low: {
        card: "border-l-4 border-l-[rgba(128,128,128,1)]",
        badge: "bg-[rgba(255,255,255,0.12)] text-[var(--color-light-gray)]",
        icon: "text-[var(--color-light-gray)]",
    },
    info: {
        card: "border-l-4 border-l-[rgba(128,128,128,1)]",
        badge: "bg-[rgba(255,255,255,0.12)] text-[rgba(191,191,191,1)]",
        icon: "text-[rgba(191,191,191,1)]",
    },
};

const typeIcons: Record<string, React.ReactNode> = {
    demand_increase: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
    ),
    restock_urgent: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
    ),
    restock_suggested: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
    ),
    seasonal_trend: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
    ),
    model_performance: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    ),
};

export default function RecommendationsPage() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAIInsights().then(setInsights).finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner text="Generating AI recommendations..." />;

    const criticalCount = insights.filter((i) => i.severity === "critical").length;
    const highCount = insights.filter((i) => i.severity === "high").length;

    return (
        <>
            <Navbar title="AI Recommendations" subtitle="Intelligent insights and actionable suggestions" />
            <div className="min-h-full bg-black p-0">
                <div className="border border-[rgba(255,255,255,0.12)] bg-[#000000]">
                {/* Summary */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-0 scroll-section border-b border-[rgba(255,255,255,0.12)]">
                    <div className="p-5 border-r border-b sm:border-b-0 border-[rgba(255,255,255,0.12)] dashboard-card">
                        <p className="text-sm text-[rgba(191,191,191,1)]">Total Insights</p>
                        <p className="text-3xl font-bold text-[var(--color-light-gray)] mt-1">{insights.length}</p>
                    </div>
                    <div className="p-5 border-r border-b sm:border-b-0 border-[rgba(255,255,255,0.12)] dashboard-card">
                        <p className="text-sm text-[rgba(191,191,191,1)]">Critical Actions</p>
                        <p className="text-3xl font-bold text-[var(--color-primary)] mt-1">{criticalCount}</p>
                    </div>
                    <div className="p-5 dashboard-card">
                        <p className="text-sm text-[rgba(191,191,191,1)]">High Priority</p>
                        <p className="text-3xl font-bold text-[var(--color-deep-red)] mt-1">{highCount}</p>
                    </div>
                </section>

                {/* Insights list */}
                <section className="grid grid-cols-1 gap-0 scroll-section">
                    {insights.map((insight, i) => {
                        const style = severityStyles[insight.severity] || severityStyles.info;
                        const icon = typeIcons[insight.type] || typeIcons.model_performance;
                        return (
                            <div key={i} className={`p-6 border-b border-[rgba(255,255,255,0.12)] ${style.card} dashboard-card`}>
                                <div className="flex items-start gap-4">
                                    <div className={`shrink-0 mt-0.5 ${style.icon}`}>{icon}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h3 className="text-base font-bold text-[var(--color-light-gray)]">{insight.title}</h3>
                                            <span className={`px-2.5 py-0.5 text-xs font-semibold capitalize ${style.badge}`}>
                                                {insight.severity}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[rgba(191,191,191,1)] leading-relaxed mb-3">{insight.message}</p>
                                        <div className="bg-[rgba(26,26,26,0.72)] p-3.5 border border-[rgba(255,255,255,0.12)]">
                                            <p className="text-xs font-semibold text-[rgba(191,191,191,1)] uppercase tracking-wider mb-1">
                                                Recommended Action
                                            </p>
                                            <p className="text-sm text-[var(--color-light-gray)] font-medium">{insight.action}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </section>
                </div>
            </div>
        </>
    );
}
