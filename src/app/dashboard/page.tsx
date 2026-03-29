"use client";

import { useEffect, useState } from "react";
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart,
} from "recharts";
import Navbar from "@/components/Navbar";
import KPICard from "@/components/KPICard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getDashboardStats, getTopDrugs, getAlerts, getTrendData } from "@/lib/api";

interface Stats {
    totalDrugs: number;
    predictedDemand7d: number;
    highDemandAlerts: number;
    avgForecastAccuracy: number;
}

interface TopDrug {
    id: number;
    name: string;
    category: string;
    predictedDemand: number;
    trend: string;
    changePercent: number;
}

interface Alert {
    type: string;
    title: string;
    message: string;
}

interface TrendPoint {
    date: string;
    totalDemand: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [topDrugs, setTopDrugs] = useState<TopDrug[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [trend, setTrend] = useState<TrendPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getDashboardStats(), getTopDrugs(), getAlerts(), getTrendData()])
            .then(([s, d, a, t]) => {
                setStats(s);
                setTopDrugs(d);
                setAlerts(a);
                setTrend(t);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner text="Loading dashboard..." />;

    const alertTypeStyles: Record<string, string> = {
        critical: "border-l-[var(--color-primary)] bg-[rgba(255,0,0,0.14)]",
        warning: "border-l-[var(--color-deep-red)] bg-[rgba(192,0,24,0.16)]",
        info: "border-l-[rgba(224,226,228,0.6)] bg-[rgba(224,226,228,0.08)]",
    };

    return (
        <>
            <Navbar title="Dashboard" subtitle="Overview of pharmaceutical demand analytics" />
            <div className="p-6 lg:p-8 space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 scroll-section">
                    <KPICard
                        title="Total Drugs"
                        value={stats?.totalDrugs ?? 0}
                        subtitle="Active pharmaceutical products"
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>}
                        color="#FF0000"
                        trend="stable"
                        trendValue="No change"
                    />
                    <KPICard
                        title="Predicted Demand (7d)"
                        value={stats?.predictedDemand7d?.toLocaleString() ?? "0"}
                        subtitle="Units forecasted for next week"
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
                        color="#C00018"
                        trend="up"
                        trendValue="+12.4%"
                    />
                    <KPICard
                        title="High Demand Alerts"
                        value={stats?.highDemandAlerts ?? 0}
                        subtitle="Drugs needing attention"
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
                        color="#FF0000"
                        trend="up"
                        trendValue="Needs review"
                    />
                    <KPICard
                        title="Forecast Accuracy"
                        value={`${stats?.avgForecastAccuracy ?? 0}%`}
                        subtitle="TFT model performance"
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
                        color="#E0E2E4"
                        trend="up"
                        trendValue="+2.1%"
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 scroll-section">
                    {/* Trend Chart */}
                    <div className="xl:col-span-2 glass-card p-6 dashboard-card chart-section">
                        <h2 className="text-lg font-bold text-[var(--color-light-gray)] mb-1">Demand Trend</h2>
                        <p className="text-sm text-[rgba(224,226,228,0.72)] mb-4">Total demand over the last 30 days</p>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trend}>
                                    <defs>
                                        <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FF0000" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#FF0000" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(224,226,228,0.16)" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11, fill: "#E0E2E4" }}
                                        tickFormatter={(v) => v.slice(5)}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "#E0E2E4" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: "1px solid rgba(224,226,228,0.18)",
                                            backgroundColor: "#000000",
                                            fontSize: 13,
                                            color: "#E0E2E4",
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="totalDemand"
                                        stroke="#FF0000"
                                        strokeWidth={2.5}
                                        fill="url(#colorDemand)"
                                        name="Total Demand"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Drugs */}
                    <div className="glass-card p-6 dashboard-card">
                        <h2 className="text-lg font-bold text-[var(--color-light-gray)] mb-1">Top Recommended Drugs</h2>
                        <p className="text-sm text-[rgba(224,226,228,0.72)] mb-4">Highest predicted demand</p>
                        <div className="space-y-3">
                            {topDrugs.map((drug, i) => (
                                <div
                                    key={drug.id}
                                    className="flex items-center gap-4 p-3 rounded-xl bg-[rgba(29,30,39,0.55)] hover:bg-[rgba(29,30,39,0.78)] transition-colors"
                                >
                                    <span className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-[var(--color-light-gray)] font-bold text-sm shrink-0">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[var(--color-light-gray)] truncate">{drug.name}</p>
                                        <p className="text-xs text-[rgba(224,226,228,0.72)]">{drug.category}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-bold text-[var(--color-light-gray)]">{drug.predictedDemand}</p>
                                        <p className={`text-xs font-semibold ${drug.changePercent > 0 ? "text-[var(--color-primary)]" : drug.changePercent < 0 ? "text-[var(--color-deep-red)]" : "text-[rgba(224,226,228,0.72)]"}`}>
                                            {drug.changePercent > 0 ? "+" : ""}{drug.changePercent}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                <div className="glass-card p-6 dashboard-card scroll-section">
                    <h2 className="text-lg font-bold text-[var(--color-light-gray)] mb-1">Active Alerts</h2>
                    <p className="text-sm text-[rgba(224,226,228,0.72)] mb-4">Stock and demand notifications</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {alerts.map((alert, i) => (
                            <div
                                key={i}
                                className={`border-l-4 rounded-xl p-4 ${alertTypeStyles[alert.type] || "border-l-[rgba(224,226,228,0.6)] bg-[rgba(224,226,228,0.08)]"}`}
                            >
                                <p className="text-sm font-semibold text-[var(--color-light-gray)] mb-1">{alert.title}</p>
                                <p className="text-xs text-[rgba(224,226,228,0.78)] leading-relaxed">{alert.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
