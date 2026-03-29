"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart,
} from "recharts";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
    getAlerts,
    getDashboardStats,
    getModelStatus,
    getResults,
    getTopDrugs,
    getTrendData,
    type AuthUser,
    type ModelOutput,
} from "@/lib/api";

const LOCAL_USER_KEY = "pharmasens_user";

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
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [topDrugs, setTopDrugs] = useState<TopDrug[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [trend, setTrend] = useState<TrendPoint[]>([]);
    const [email, setEmail] = useState<string>("");
    const [selectedModel, setSelectedModel] = useState<"linear" | "rf" | "tft">("linear");
    const [modelStatus, setModelStatus] = useState<{ linear: string; rf: string; tft: string }>({
        linear: "not_started",
        rf: "not_started",
        tft: "not_started",
    });
    const [activeResult, setActiveResult] = useState<ModelOutput | null>(null);
    const [resultsError, setResultsError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const raw = localStorage.getItem(LOCAL_USER_KEY);
        if (!raw) {
            router.replace("/login");
            return;
        }

        let user: AuthUser;
        try {
            user = JSON.parse(raw) as AuthUser;
        } catch {
            localStorage.removeItem(LOCAL_USER_KEY);
            router.replace("/login");
            return;
        }

        if (user.isNewUser || !user.hasUploadedData) {
            router.replace("/onboarding");
            return;
        }

        Promise.all([getDashboardStats(), getTopDrugs(), getAlerts(), getTrendData()])
            .then(([s, d, a, t]) => {
                setEmail(user.email);
                setStats(s);
                setTopDrugs(d);
                setAlerts(a);
                setTrend(t);
            })
            .finally(() => setLoading(false));
    }, [router]);

    useEffect(() => {
        if (!email) {
            return;
        }

        getModelStatus(email)
            .then((res) => setModelStatus(res.status))
            .catch(() => {
                // Dashboard still works with core sample data.
            });
    }, [email]);

    useEffect(() => {
        if (!email) {
            return;
        }

        getResults(email, selectedModel)
            .then((res) => {
                setResultsError("");
                setActiveResult(res.active);
                setModelStatus(res.status);
            })
            .catch((err) => {
                setActiveResult(null);
                setResultsError(err instanceof Error ? err.message : "Results unavailable");
            });
    }, [email, selectedModel]);

    if (loading) return <LoadingSpinner text="Loading dashboard..." />;

    const alertTypeStyles: Record<string, string> = {
        critical: "border-l-[var(--color-primary)] bg-[rgba(255,0,0,0.14)]",
        warning: "border-l-[var(--color-deep-red)] bg-[rgba(255,77,77,0.16)]",
        info: "border-l-[rgba(128,128,128,1)] bg-[rgba(255,255,255,0.12)]",
    };

    return (
        <>
            <Navbar title="Dashboard" subtitle="Overview of pharmaceutical demand analytics" />
            <div className="min-h-full bg-black p-0">
                <div className="scroll-section border border-[rgba(255,255,255,0.12)] bg-[#000000]">
                    {/* Row 1: KPI Blocks */}
                    <section className="border-b border-[rgba(255,255,255,0.12)]">
                        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="border-b border-[rgba(255,255,255,0.12)] p-6 sm:border-r xl:border-b-0">
                                <p className="text-xs uppercase tracking-widest text-[rgba(191,191,191,1)] mb-2">Total Drugs</p>
                                <p className="text-3xl font-semibold text-[var(--color-light-gray)]">{stats?.totalDrugs ?? 0}</p>
                                <p className="text-xs text-[rgba(128,128,128,1)] mt-1">Active pharmaceutical products</p>
                            </div>
                            <div className="border-b border-[rgba(255,255,255,0.12)] p-6 xl:border-r xl:border-b-0">
                                <p className="text-xs uppercase tracking-widest text-[rgba(191,191,191,1)] mb-2">Predicted Demand (7d)</p>
                                <p className="text-3xl font-semibold text-[var(--color-light-gray)]">{stats?.predictedDemand7d?.toLocaleString() ?? "0"}</p>
                                <p className="text-xs text-[rgba(128,128,128,1)] mt-1">Units forecasted for next week</p>
                            </div>
                            <div className="border-b border-[rgba(255,255,255,0.12)] p-6 sm:border-r xl:border-b-0 xl:border-r">
                                <p className="text-xs uppercase tracking-widest text-[rgba(191,191,191,1)] mb-2">High Demand Alerts</p>
                                <p className="text-3xl font-semibold text-[var(--color-light-gray)]">{stats?.highDemandAlerts ?? 0}</p>
                                <p className="text-xs text-[rgba(128,128,128,1)] mt-1">Drugs needing attention</p>
                            </div>
                            <div className="p-6">
                                <p className="text-xs uppercase tracking-widest text-[rgba(191,191,191,1)] mb-2">Forecast Accuracy</p>
                                <p className="text-3xl font-semibold text-[var(--color-light-gray)]">{`${stats?.avgForecastAccuracy ?? 0}%`}</p>
                                <p className="text-xs text-[rgba(128,128,128,1)] mt-1">TFT model performance</p>
                            </div>
                        </div>
                    </section>

                    {/* Row 2: Chart + Side Panel */}
                    <section className="grid grid-cols-1 gap-0 border-b border-[rgba(255,255,255,0.12)] xl:grid-cols-12">
                        <div className="xl:col-span-8 p-6 lg:p-8 border-b border-[rgba(255,255,255,0.12)] xl:border-b-0 xl:border-r">
                            <h2 className="text-lg font-bold text-[var(--color-light-gray)] mb-1">Demand Trend</h2>
                            <p className="text-sm text-[rgba(191,191,191,1)] mb-4">Total demand over the last 30 days</p>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trend}>
                                        <defs>
                                            <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#FF0000" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#FF0000" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 11, fill: "#FFFFFF" }}
                                            tickFormatter={(v) => v.slice(5)}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: "#FFFFFF" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 12,
                                                border: "1px solid rgba(255,255,255,0.12)",
                                                backgroundColor: "#000000",
                                                fontSize: 13,
                                                color: "#FFFFFF",
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

                        <div className="xl:col-span-4 p-6 lg:p-8">
                            <h2 className="text-lg font-bold text-[var(--color-light-gray)] mb-1">Top Recommended Drugs</h2>
                            <p className="text-sm text-[rgba(191,191,191,1)] mb-4">Highest predicted demand</p>
                            <div className="border border-[rgba(255,255,255,0.12)]">
                                {topDrugs.map((drug, i) => (
                                    <div
                                        key={drug.id}
                                        className="flex items-center gap-4 p-3 border-b border-[rgba(255,255,255,0.12)] last:border-b-0 bg-[rgba(13,15,18,0.45)] hover:bg-[rgba(13,15,18,0.65)] transition-colors"
                                    >
                                        <span className="w-8 h-8 flex items-center justify-center text-[var(--color-light-gray)] font-bold text-sm shrink-0 border border-[rgba(255,255,255,0.12)] bg-[rgba(255,0,0,0.18)]">
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[var(--color-light-gray)] truncate">{drug.name}</p>
                                            <p className="text-xs text-[rgba(191,191,191,1)]">{drug.category}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold text-[var(--color-light-gray)]">{drug.predictedDemand}</p>
                                            <p className={`text-xs font-semibold ${drug.changePercent > 0 ? "text-[var(--color-primary)]" : drug.changePercent < 0 ? "text-[var(--color-deep-red)]" : "text-[rgba(191,191,191,1)]"}`}>
                                                {drug.changePercent > 0 ? "+" : ""}{drug.changePercent}%
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Row 3: Full-width Alerts */}
                    <section className="p-6 lg:p-8">
                            <h2 className="text-lg font-bold text-[var(--color-light-gray)] mb-1">Active Alerts</h2>
                            <p className="text-sm text-[rgba(191,191,191,1)] mb-4">Stock and demand notifications</p>
                            <div className="grid grid-cols-1 gap-0 md:grid-cols-2 border border-[rgba(255,255,255,0.12)]">
                                {alerts.map((alert, i) => (
                                    <div
                                        key={i}
                                        className={`border-b border-r border-[rgba(255,255,255,0.12)] p-4 md:[&:nth-child(2n)]:border-r-0 [&:nth-last-child(-n+2)]:md:border-b-0 [&:last-child]:border-b-0 ${alertTypeStyles[alert.type] || "border-l-[rgba(128,128,128,1)] bg-[rgba(255,255,255,0.12)]"}`}
                                    >
                                        <p className="text-sm font-semibold text-[var(--color-light-gray)] mb-1">{alert.title}</p>
                                        <p className="text-xs text-[rgba(191,191,191,1)] leading-relaxed">{alert.message}</p>
                                    </div>
                                ))}
                            </div>
                    </section>

                    <section className="border-t border-[rgba(255,255,255,0.12)] p-6 lg:p-8">
                        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-[var(--color-light-gray)] mb-1">AI Model Results</h2>
                                <p className="text-sm text-[rgba(191,191,191,1)]">Forecast graph, metrics, demand patterns, and recommendations</p>
                            </div>
                            <div className="grid grid-cols-3 border border-[rgba(255,255,255,0.12)]">
                                {([
                                    ["linear", "Linear"],
                                    ["rf", "RF"],
                                    ["tft", "TFT"],
                                ] as const).map(([key, label]) => {
                                    const ready = modelStatus[key] === "ready" || key === "linear";
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            disabled={!ready}
                                            onClick={() => setSelectedModel(key)}
                                            className={`px-4 py-2 text-xs uppercase tracking-widest border-r border-[rgba(255,255,255,0.12)] last:border-r-0 ${
                                                selectedModel === key
                                                    ? "bg-[rgba(255,0,0,0.2)] text-white"
                                                    : "bg-[#0D1117] text-[rgba(191,191,191,1)]"
                                            } disabled:cursor-not-allowed disabled:opacity-50`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mb-5 grid grid-cols-1 gap-0 md:grid-cols-3 border border-[rgba(255,255,255,0.12)]">
                            {([
                                ["linear", "Linear Regression"],
                                ["rf", "Random Forest"],
                                ["tft", "TFT"],
                            ] as const).map(([key, label]) => (
                                <div key={key} className="border-b border-r border-[rgba(255,255,255,0.12)] p-4 last:border-r-0 md:border-b-0">
                                    <p className="text-xs uppercase tracking-widest text-[rgba(191,191,191,1)]">{label}</p>
                                    <p className="mt-1 text-sm text-[var(--color-light-gray)]">{modelStatus[key]}</p>
                                </div>
                            ))}
                        </div>

                        {activeResult ? (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 gap-0 border border-[rgba(255,255,255,0.12)] md:grid-cols-4">
                                    <div className="border-b border-r border-[rgba(255,255,255,0.12)] p-4 md:border-b-0">
                                        <p className="text-xs uppercase tracking-widest text-[rgba(191,191,191,1)]">Model</p>
                                        <p className="mt-1 text-sm font-semibold text-[var(--color-light-gray)]">{activeResult.model}</p>
                                    </div>
                                    <div className="border-b border-r border-[rgba(255,255,255,0.12)] p-4 md:border-b-0">
                                        <p className="text-xs uppercase tracking-widest text-[rgba(191,191,191,1)]">Accuracy</p>
                                        <p className="mt-1 text-sm font-semibold text-[var(--color-light-gray)]">{activeResult.accuracy}%</p>
                                    </div>
                                    <div className="border-b border-r border-[rgba(255,255,255,0.12)] p-4 md:border-b-0">
                                        <p className="text-xs uppercase tracking-widest text-[rgba(191,191,191,1)]">MAE</p>
                                        <p className="mt-1 text-sm font-semibold text-[var(--color-light-gray)]">{activeResult.mae}</p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs uppercase tracking-widest text-[rgba(191,191,191,1)]">Volatility</p>
                                        <p className="mt-1 text-sm font-semibold text-[var(--color-light-gray)]">{activeResult.demandPattern.volatility}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-0 border border-[rgba(255,255,255,0.12)] xl:grid-cols-12">
                                    <div className="xl:col-span-8 border-b border-[rgba(255,255,255,0.12)] p-6 xl:border-b-0 xl:border-r">
                                        <h3 className="mb-3 text-sm uppercase tracking-widest text-[rgba(191,191,191,1)]">Forecast Graph</h3>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={activeResult.graphData}>
                                                    <defs>
                                                        <linearGradient id="modelPred" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#FF0000" stopOpacity={0.35} />
                                                            <stop offset="95%" stopColor="#FF0000" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#FFFFFF" }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 11, fill: "#FFFFFF" }} axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            borderRadius: 0,
                                                            border: "1px solid rgba(255,255,255,0.12)",
                                                            backgroundColor: "#000000",
                                                            color: "#FFFFFF",
                                                        }}
                                                    />
                                                    <Area type="monotone" dataKey="actual" stroke="#9CA3AF" strokeWidth={2} fill="transparent" name="Actual" />
                                                    <Area type="monotone" dataKey="predicted" stroke="#FF0000" strokeWidth={2.5} fill="url(#modelPred)" name="Predicted" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="xl:col-span-4 p-6">
                                        <h3 className="mb-3 text-sm uppercase tracking-widest text-[rgba(191,191,191,1)]">Recommendations</h3>
                                        <div className="border border-[rgba(255,255,255,0.12)]">
                                            {activeResult.recommendations.map((item, idx) => (
                                                <div key={idx} className="border-b border-[rgba(255,255,255,0.12)] p-3 text-xs text-[rgba(191,191,191,1)] last:border-b-0">
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] p-4 text-sm text-[rgba(191,191,191,1)]">
                                {resultsError || "No training results available yet. Complete onboarding and run model training."}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
