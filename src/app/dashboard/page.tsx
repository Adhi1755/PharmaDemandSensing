"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart,
    BarChart, Bar, Cell, PieChart, Pie,
} from "recharts";
import Navbar from "@/components/Navbar";
import {
    getDashboardFull,
    getTopDrugs,
    type AuthUser,
    type DashboardFull,
} from "@/lib/api";

const LOCAL_USER_KEY = "pharmasens_user";

/* ─── Animated counter ─── */
function AnimatedNumber({ target, duration = 1200, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
    const [current, setCurrent] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        if (started.current || target === 0) return;
        started.current = true;
        const start = Date.now();
        const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(Math.round(target * eased * 100) / 100);
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [target, duration]);

    return <>{typeof current === "number" && current % 1 !== 0 ? current.toFixed(1) : current.toLocaleString()}{suffix}</>;
}

/* ─── KPI Card ─── */
function KPICard({
    label,
    value,
    sublabel,
    delay = 0,
    color = "#FF0000",
}: {
    label: string;
    value: number;
    sublabel: string;
    delay?: number;
    color?: string;
}) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div
            style={{
                padding: "1.5rem",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                borderRight: "1px solid rgba(255,255,255,0.08)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Subtle accent glow */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${color}, transparent)`,
                opacity: 0.6,
            }} />
            <p style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "rgba(191,191,191,1)",
                marginBottom: 10,
            }}>
                {label}
            </p>
            <p style={{ fontSize: "2.2rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                {visible && value > 0 ? (
                    <AnimatedNumber target={value} suffix="%" duration={1000} />
                ) : (
                    <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>
                )}
            </p>
            <p style={{ fontSize: "0.75rem", color: "rgba(128,128,128,1)", marginTop: 6 }}>{sublabel}</p>
        </div>
    );
}

/* ─── Section fade wrapper ─── */
function FadeSection({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);
    return (
        <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
            ...style,
        }}>
            {children}
        </div>
    );
}

/* ─── Section header ─── */
function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>{title}</h2>
            <p style={{ fontSize: "0.82rem", color: "rgba(191,191,191,1)" }}>{subtitle}</p>
        </div>
    );
}

/* ─── Demand distribution donut label ─── */
const DEMAND_COLORS: Record<string, string> = {
    Low: "#34D399",
    Medium: "#FBBF24",
    High: "#F85149",
};

/* ─── Custom tooltip ─── */
const CHART_TOOLTIP_STYLE: React.CSSProperties = {
    borderRadius: 6,
    border: "1px solid rgba(255,0,0,0.3)",
    backgroundColor: "#0D1117",
    fontSize: 12,
    color: "#FFFFFF",
};

/* ─── Page enter overlay ─── */
function PageEnterOverlay() {
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        const t = setTimeout(() => setVisible(false), 800);
        return () => clearTimeout(t);
    }, []);
    if (!visible) return null;
    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9998,
            background: "#000", pointerEvents: "none",
            animation: "dashboardEnter 0.8s ease-out forwards",
        }} />
    );
}

/* ═══════════════════════════════════════════
   MAIN DASHBOARD PAGE
═══════════════════════════════════════════ */

interface TopDrug {
    name: string;
    totalDemand: number;
    avgDemand: number;
    trend: string;
    changePercent: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const routerRef = useRef(router);
    const hasFetched = useRef(false);
    const [dashboard, setDashboard] = useState<DashboardFull | null>(null);
    const [topDrugs, setTopDrugs] = useState<TopDrug[]>([]);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [chartAnimating, setChartAnimating] = useState(false);

    // Keep router ref current without triggering re-renders
    useEffect(() => {
        routerRef.current = router;
    });

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const raw = localStorage.getItem(LOCAL_USER_KEY);
        if (!raw) { routerRef.current.replace("/login"); return; }
        let user: AuthUser;
        try {
            user = JSON.parse(raw) as AuthUser;
        } catch {
            localStorage.removeItem(LOCAL_USER_KEY);
            routerRef.current.replace("/login");
            return;
        }
        if (user.isNewUser || !user.hasUploadedData) {
            routerRef.current.replace("/onboarding");
            return;
        }

        setEmail(user.email);

        Promise.all([
            getDashboardFull(user.email),
            getTopDrugs(user.email),
        ])
            .then(([d, drugs]) => {
                setDashboard(d);
                setTopDrugs(drugs);
            })
            .catch((err) => {
                console.error("Dashboard load error:", err);
            })
            .finally(() => {
                setLoading(false);
                setTimeout(() => setChartAnimating(true), 300);
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh", background: "#000",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 20,
            }}>
                <div style={{ position: "relative", width: 56, height: 56 }}>
                    <svg width="56" height="56" viewBox="0 0 56 56" style={{ animation: "spin 1s linear infinite" }}>
                        <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,0,0,0.15)" strokeWidth="3" />
                        <circle cx="28" cy="28" r="24" fill="none" stroke="#FF0000" strokeWidth="3"
                            strokeDasharray="150.8" strokeDashoffset="113.1" strokeLinecap="round" />
                    </svg>
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>Loading dashboard...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const kpi = dashboard?.kpi;
    const forecast = dashboard?.forecast;
    const demandDist = dashboard?.demandDistribution || [];
    const importance = dashboard?.featureImportance || [];
    const insights = dashboard?.insights || [];

    // Build combined chart data for LSTM forecast
    const forecastChartData: { date: string; actual?: number; predicted?: number }[] = [];
    if (forecast) {
        // Historical
        for (const h of forecast.historical || []) {
            forecastChartData.push({ date: h.date, actual: h.actual });
        }
        // Past predictions overlay
        const predMap = new Map<string, number>();
        for (const p of forecast.pastPredictions || []) {
            predMap.set(p.date, p.predicted);
        }
        for (const item of forecastChartData) {
            if (predMap.has(item.date)) {
                item.predicted = predMap.get(item.date);
            }
        }
        // Future forecast
        for (const f of forecast.futureForecast || []) {
            forecastChartData.push({ date: f.date, predicted: f.predicted });
        }
    }

    return (
        <>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes dashboardEnter { from { opacity: 1; } to { opacity: 0; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                .drug-row:hover { background: rgba(255,0,0,0.06) !important; }
                .insight-card:hover { border-color: rgba(255,0,0,0.3) !important; }
            `}</style>

            <PageEnterOverlay />
            <Navbar title="Dashboard" subtitle="Real-time ML-powered pharmaceutical demand analytics" />

            <div style={{ minHeight: "100%", background: "#000" }}>
                <div style={{ border: "1px solid rgba(255,255,255,0.1)", background: "#000" }}>

                    {/* ── Row 1: KPI Cards (Accuracy, Precision, Recall, F1) ── */}
                    <section style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
                            <KPICard
                                label="Accuracy"
                                value={kpi?.accuracy ?? 0}
                                sublabel="XGBoost classification accuracy"
                                delay={100}
                                color="#34D399"
                            />
                            <KPICard
                                label="Precision"
                                value={kpi?.precision ?? 0}
                                sublabel="Weighted precision score"
                                delay={220}
                                color="#60A5FA"
                            />
                            <KPICard
                                label="Recall"
                                value={kpi?.recall ?? 0}
                                sublabel="Weighted recall score"
                                delay={340}
                                color="#C084FC"
                            />
                            <KPICard
                                label="F1 Score"
                                value={kpi?.f1 ?? 0}
                                sublabel="Harmonic mean of precision & recall"
                                delay={460}
                                color="#FBBF24"
                            />
                        </div>
                    </section>

                    {/* ── Row 2: LSTM Forecast Chart + Demand Distribution ── */}
                    <FadeSection delay={500} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "8fr 4fr" }}>
                            {/* LSTM Forecast Chart */}
                            <div style={{ padding: "1.5rem 2rem", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
                                <SectionHeader
                                    title="LSTM Demand Forecast"
                                    subtitle="Historical sales vs LSTM predicted demand (past + future)"
                                />
                                <div style={{ height: 300 }}>
                                    {forecastChartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartAnimating ? forecastChartData : []}>
                                                <defs>
                                                    <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="gradPredicted" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#FF0000" stopOpacity={0.35} />
                                                        <stop offset="95%" stopColor="#FF0000" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 10, fill: "#808080" }}
                                                    tickFormatter={(v) => v.slice(5)}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis tick={{ fontSize: 10, fill: "#808080" }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="actual"
                                                    stroke="#60A5FA"
                                                    strokeWidth={2}
                                                    fill="url(#gradActual)"
                                                    name="Actual Sales"
                                                    isAnimationActive={chartAnimating}
                                                    animationDuration={1800}
                                                    animationEasing="ease-out"
                                                    connectNulls={false}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="predicted"
                                                    stroke="#FF0000"
                                                    strokeWidth={2.5}
                                                    fill="url(#gradPredicted)"
                                                    name="LSTM Predicted"
                                                    strokeDasharray="6 3"
                                                    isAnimationActive={chartAnimating}
                                                    animationDuration={2200}
                                                    animationEasing="ease-out"
                                                    connectNulls={false}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div style={{
                                            height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                                            border: "1px solid rgba(255,255,255,0.08)", color: "rgba(191,191,191,0.6)", fontSize: "0.85rem",
                                        }}>
                                            No forecast data available
                                        </div>
                                    )}
                                </div>
                                {/* Legend */}
                                <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <div style={{ width: 16, height: 3, background: "#60A5FA", borderRadius: 2 }} />
                                        <span style={{ fontSize: "0.72rem", color: "rgba(191,191,191,0.8)" }}>Historical</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <div style={{ width: 16, height: 3, background: "#FF0000", borderRadius: 2 }} />
                                        <span style={{ fontSize: "0.72rem", color: "rgba(191,191,191,0.8)" }}>LSTM Forecast</span>
                                    </div>
                                </div>
                            </div>

                            {/* Demand Distribution */}
                            <div style={{ padding: "1.5rem" }}>
                                <SectionHeader
                                    title="Prediction Distribution"
                                    subtitle="XGBoost demand classification"
                                />
                                {demandDist.length > 0 ? (
                                    <>
                                        <div style={{ height: 200, display: "flex", justifyContent: "center" }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={demandDist}
                                                        dataKey="count"
                                                        nameKey="label"
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={50}
                                                        outerRadius={80}
                                                        paddingAngle={3}
                                                        isAnimationActive={chartAnimating}
                                                        animationDuration={1200}
                                                    >
                                                        {demandDist.map((entry) => (
                                                            <Cell
                                                                key={entry.label}
                                                                fill={DEMAND_COLORS[entry.label] || "#6E7681"}
                                                                stroke="rgba(0,0,0,0.3)"
                                                                strokeWidth={2}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        {/* Legend items */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                                            {demandDist.map((d) => (
                                                <div key={d.label} style={{
                                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                                    padding: "8px 12px",
                                                    border: "1px solid rgba(255,255,255,0.08)",
                                                    background: "rgba(255,255,255,0.02)",
                                                }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <div style={{
                                                            width: 10, height: 10, borderRadius: "50%",
                                                            background: DEMAND_COLORS[d.label] || "#6E7681",
                                                        }} />
                                                        <span style={{ fontSize: "0.82rem", color: "#fff" }}>
                                                            {d.label} Demand
                                                        </span>
                                                    </div>
                                                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
                                                        {d.count.toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{
                                        height: 200, display: "flex", alignItems: "center", justifyContent: "center",
                                        border: "1px solid rgba(255,255,255,0.08)", color: "rgba(191,191,191,0.6)", fontSize: "0.85rem",
                                    }}>
                                        No distribution data
                                    </div>
                                )}
                            </div>
                        </div>
                    </FadeSection>

                    {/* ── Row 3: Feature Importance + Top Products ── */}
                    <FadeSection delay={700} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr" }}>
                            {/* Feature Importance */}
                            <div style={{ padding: "1.5rem 2rem", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
                                <SectionHeader
                                    title="Feature Importance"
                                    subtitle="XGBoost model — which features drive demand predictions"
                                />
                                {importance.length > 0 ? (
                                    <div style={{ height: 280 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={importance.slice(0, 10)}
                                                layout="vertical"
                                                margin={{ left: 100, right: 20 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                                                <XAxis
                                                    type="number"
                                                    tick={{ fontSize: 10, fill: "#808080" }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="feature"
                                                    tick={{ fontSize: 11, fill: "#BFBFBF" }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={95}
                                                />
                                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                                <Bar
                                                    dataKey="importance"
                                                    name="Importance"
                                                    radius={[0, 4, 4, 0]}
                                                    isAnimationActive={chartAnimating}
                                                    animationDuration={1400}
                                                >
                                                    {importance.slice(0, 10).map((_, idx) => (
                                                        <Cell
                                                            key={idx}
                                                            fill={`rgba(255, ${Math.max(0, 77 - idx * 8)}, ${Math.max(0, 77 - idx * 8)}, ${1 - idx * 0.08})`}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div style={{
                                        height: 200, display: "flex", alignItems: "center", justifyContent: "center",
                                        border: "1px solid rgba(255,255,255,0.08)", color: "rgba(191,191,191,0.6)", fontSize: "0.85rem",
                                    }}>
                                        No feature importance data
                                    </div>
                                )}
                            </div>

                            {/* Top Products */}
                            <div style={{ padding: "1.5rem" }}>
                                <SectionHeader
                                    title="Top Products"
                                    subtitle="Highest demand from your dataset"
                                />
                                <div style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                                    {topDrugs.length > 0 ? topDrugs.map((drug, i) => (
                                        <div
                                            key={drug.name}
                                            className="drug-row"
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 12,
                                                padding: "12px 14px",
                                                borderBottom: i < topDrugs.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                                                background: "transparent",
                                                transition: "background 0.2s ease",
                                                opacity: 0,
                                                animation: `slideUp 0.4s ease-out ${0.8 + i * 0.1}s forwards`,
                                                cursor: "default",
                                            }}
                                        >
                                            <span style={{
                                                width: 28, height: 28, flexShrink: 0,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: "0.72rem", fontWeight: 700,
                                                border: "1px solid rgba(255,0,0,0.3)",
                                                background: "rgba(255,0,0,0.12)",
                                                color: "#fff",
                                            }}>{i + 1}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {drug.name}
                                                </p>
                                                <p style={{ fontSize: "0.72rem", color: "rgba(191,191,191,1)" }}>
                                                    Avg: {drug.avgDemand} units/day
                                                </p>
                                            </div>
                                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff" }}>
                                                    {drug.totalDemand.toLocaleString()}
                                                </p>
                                                <p style={{
                                                    fontSize: "0.72rem", fontWeight: 600,
                                                    color: drug.changePercent > 0 ? "#34D399" : drug.changePercent < 0 ? "#F85149" : "rgba(191,191,191,1)",
                                                }}>
                                                    {drug.changePercent > 0 ? "↑" : drug.changePercent < 0 ? "↓" : "→"} {drug.changePercent > 0 ? "+" : ""}{drug.changePercent}%
                                                </p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{
                                            padding: 24, textAlign: "center",
                                            color: "rgba(191,191,191,0.6)", fontSize: "0.85rem",
                                        }}>
                                            No product data
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </FadeSection>

                    {/* ── Row 4: Pharma Insights ── */}
                    <FadeSection delay={900} style={{ padding: "1.5rem 2rem" }}>
                        <SectionHeader
                            title="AI-Powered Pharma Insights"
                            subtitle="Actionable recommendations from model predictions"
                        />
                        {insights.length > 0 ? (
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                                gap: 12,
                            }}>
                                {insights.map((ins, idx) => {
                                    const severityColor =
                                        ins.severity === "critical" ? "#FF0000" :
                                        ins.severity === "high" ? "#F85149" :
                                        ins.severity === "medium" ? "#FBBF24" : "#34D399";
                                    const severityBg =
                                        ins.severity === "critical" ? "rgba(255,0,0,0.08)" :
                                        ins.severity === "high" ? "rgba(248,81,73,0.08)" :
                                        ins.severity === "medium" ? "rgba(251,191,36,0.06)" : "rgba(52,211,153,0.06)";

                                    return (
                                        <div
                                            key={idx}
                                            className="insight-card"
                                            style={{
                                                padding: "16px 18px",
                                                border: `1px solid rgba(255,255,255,0.1)`,
                                                borderLeft: `3px solid ${severityColor}`,
                                                background: severityBg,
                                                opacity: 0,
                                                animation: `slideUp 0.4s ease-out ${1.0 + idx * 0.08}s forwards`,
                                                transition: "border-color 0.2s ease",
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                                <span style={{
                                                    width: 8, height: 8, borderRadius: "50%",
                                                    background: severityColor, flexShrink: 0,
                                                }} />
                                                <p style={{
                                                    fontSize: "0.72rem", textTransform: "uppercase",
                                                    letterSpacing: "0.08em", color: severityColor,
                                                    fontWeight: 700,
                                                }}>
                                                    {ins.type.replace(/_/g, " ")}
                                                </p>
                                            </div>
                                            <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "#fff", marginBottom: 6, lineHeight: 1.3 }}>
                                                {ins.title}
                                            </p>
                                            <p style={{ fontSize: "0.78rem", color: "rgba(191,191,191,1)", lineHeight: 1.5 }}>
                                                {ins.message}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{
                                border: "1px solid rgba(255,255,255,0.08)",
                                padding: 24, textAlign: "center",
                                color: "rgba(191,191,191,0.6)", fontSize: "0.85rem",
                            }}>
                                Upload and process data to generate insights
                            </div>
                        )}
                    </FadeSection>

                    {/* ── Row 5: Model Comparison (if RF available) ── */}
                    {dashboard?.rfMetrics && (
                        <FadeSection delay={1100} style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "1.5rem 2rem" }}>
                            <SectionHeader
                                title="Model Comparison"
                                subtitle="XGBoost vs Random Forest classification performance"
                            />
                            <div style={{
                                display: "grid", gridTemplateColumns: "1fr 1fr",
                                border: "1px solid rgba(255,255,255,0.1)",
                            }}>
                                {/* XGBoost */}
                                <div style={{ padding: "1.25rem", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                                        <div style={{
                                            padding: "4px 10px", fontSize: "0.68rem", fontWeight: 700,
                                            background: "rgba(255,0,0,0.15)", color: "#F85149",
                                            letterSpacing: "0.1em", textTransform: "uppercase",
                                        }}>XGBoost</div>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        {[
                                            { l: "Accuracy", v: kpi?.accuracy },
                                            { l: "Precision", v: kpi?.precision },
                                            { l: "Recall", v: kpi?.recall },
                                            { l: "F1", v: kpi?.f1 },
                                        ].map((m) => (
                                            <div key={m.l}>
                                                <p style={{ fontSize: "0.68rem", color: "rgba(191,191,191,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.l}</p>
                                                <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginTop: 4 }}>{m.v?.toFixed(1)}%</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Random Forest */}
                                <div style={{ padding: "1.25rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                                        <div style={{
                                            padding: "4px 10px", fontSize: "0.68rem", fontWeight: 700,
                                            background: "rgba(96,165,250,0.15)", color: "#60A5FA",
                                            letterSpacing: "0.1em", textTransform: "uppercase",
                                        }}>Random Forest</div>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        {[
                                            { l: "Accuracy", v: dashboard.rfMetrics?.accuracy },
                                            { l: "Precision", v: dashboard.rfMetrics?.precision },
                                            { l: "Recall", v: dashboard.rfMetrics?.recall },
                                            { l: "F1", v: dashboard.rfMetrics?.f1 },
                                        ].map((m) => (
                                            <div key={m.l}>
                                                <p style={{ fontSize: "0.68rem", color: "rgba(191,191,191,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.l}</p>
                                                <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginTop: 4 }}>{m.v?.toFixed(1)}%</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </FadeSection>
                    )}
                </div>
            </div>
        </>
    );
}
